import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import CourseForm from '@/components/courses/CourseForm';
import ModuleForm from '@/components/courses/ModuleForm';
import LessonForm from '@/components/courses/LessonForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, Edit2, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  lessons_count?: number;
}

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  order_index: number;
}

export default function CourseBuilder() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const isEditing = !!courseId;

  const [activeTab, setActiveTab] = useState<'details' | 'content'>('details');
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleLessons, setModuleLessons] = useState<Record<string, Lesson[]>>({});
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setActiveTab('content');
      loadModules();
    }
  }, [courseId]);

  const loadModules = async () => {
    if (!courseId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*, lessons(count)')
        .eq('course_id', courseId)
        .order('order_index');

      if (error) throw error;

      const modulesWithCount = (data as any[]).map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        order_index: m.order_index,
        lessons_count: m.lessons?.[0]?.count || 0
      }));

      setModules(modulesWithCount);
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModuleLessons = async (moduleId: string) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, content_type, order_index')
        .eq('module_id', moduleId)
        .order('order_index');

      if (error) throw error;

      setModuleLessons(prev => ({
        ...prev,
        [moduleId]: data
      }));
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
      if (!moduleLessons[moduleId]) {
        loadModuleLessons(moduleId);
      }
    }
    setExpandedModules(newExpanded);
  };

  const handleModuleSubmit = async () => {
    setShowModuleForm(false);
    setEditingModule(null);
    await loadModules();
  };

  const handleEditModule = (moduleId: string) => {
    setEditingModule(modules.find(m => m.id === moduleId) || null);
    setShowModuleForm(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module? All lessons will also be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      await loadModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Failed to delete module');
    }
  };

  const handleCourseCreated = (newCourseId?: string) => {
    if (newCourseId) {
      navigate(`/instructor/courses/${newCourseId}/edit`);
    }
  };

  const handleAddLesson = (moduleId: string) => {
    setShowLessonForm(moduleId);
    setEditingLesson(null);
  };

  const handleEditLesson = (moduleId: string, lessonId: string) => {
    setShowLessonForm(moduleId);
    setEditingLesson(lessonId);
  };

  const handleLessonSubmit = async (moduleId: string) => {
    setShowLessonForm(null);
    setEditingLesson(null);
    await loadModuleLessons(moduleId);
    await loadModules();
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      await loadModuleLessons(moduleId);
      await loadModules();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson');
    }
  };

  if (!isEditing) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">Create New Course</h1>
          <p className="text-secondary-600 mt-2">Fill in the details to create your course</p>
        </div>
        <CourseForm onSuccess={handleCourseCreated} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Edit Course</h1>
        <p className="text-secondary-600 mt-2">Manage your course content and settings</p>
      </div>

      <div className="mb-6 border-b border-secondary-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            Course Details
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'content'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            Course Content
          </button>
        </div>
      </div>

      {activeTab === 'details' ? (
        <CourseForm courseId={courseId} />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-secondary-900">Course Modules</h2>
              <p className="text-secondary-600 mt-1">Organize your course into modules and lessons</p>
            </div>
            <Button onClick={() => setShowModuleForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </div>

          {showModuleForm && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                {editingModule ? 'Edit Module' : 'New Module'}
              </h3>
              <ModuleForm
                courseId={courseId}
                moduleId={editingModule?.id}
                onSuccess={handleModuleSubmit}
                onCancel={() => {
                  setShowModuleForm(false);
                  setEditingModule(null);
                }}
              />
            </Card>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-secondary-600 mt-4">Loading modules...</p>
            </div>
          ) : modules.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">No modules yet</h3>
                <p className="text-secondary-600 mb-6">
                  Start building your course by adding your first module
                </p>
                <Button onClick={() => setShowModuleForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Module
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {modules.map((module, index) => (
                <Card key={module.id} className="overflow-hidden">
                  <div className="p-4 bg-secondary-50 border-b border-secondary-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <button className="mt-1 cursor-move text-secondary-400 hover:text-secondary-600">
                          <GripVertical className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-secondary-500">
                              Module {index + 1}
                            </span>
                            <h3 className="text-lg font-semibold text-secondary-900">
                              {module.title}
                            </h3>
                          </div>
                          {module.description && (
                            <p className="text-secondary-600 mt-1">{module.description}</p>
                          )}
                          <p className="text-sm text-secondary-500 mt-2">
                            {module.lessons_count} {module.lessons_count === 1 ? 'lesson' : 'lessons'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditModule(module.id)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteModule(module.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleModule(module.id)}
                        >
                          {expandedModules.has(module.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {expandedModules.has(module.id) && (
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-secondary-900">Lessons</h4>
                        <Button size="sm" onClick={() => handleAddLesson(module.id)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Lesson
                        </Button>
                      </div>

                      {showLessonForm === module.id && (
                        <Card className="p-4 mb-4 bg-secondary-50">
                          <h5 className="text-sm font-semibold text-secondary-900 mb-3">
                            {editingLesson ? 'Edit Lesson' : 'New Lesson'}
                          </h5>
                          <LessonForm
                            moduleId={module.id}
                            lessonId={editingLesson || undefined}
                            onSuccess={() => handleLessonSubmit(module.id)}
                            onCancel={() => {
                              setShowLessonForm(null);
                              setEditingLesson(null);
                            }}
                          />
                        </Card>
                      )}

                      {moduleLessons[module.id]?.length > 0 ? (
                        <div className="space-y-2">
                          {moduleLessons[module.id].map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-3 bg-white border border-secondary-200 rounded-lg hover:border-primary-300 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <button className="cursor-move text-secondary-400 hover:text-secondary-600">
                                  <GripVertical className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-secondary-500">
                                  {lessonIndex + 1}.
                                </span>
                                <span className="font-medium text-secondary-900">
                                  {lesson.title}
                                </span>
                                <span className="text-xs px-2 py-1 bg-secondary-100 text-secondary-700 rounded">
                                  {lesson.content_type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditLesson(module.id, lesson.id)}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-secondary-50 rounded-lg">
                          <p className="text-secondary-600 mb-4">No lessons in this module yet</p>
                          <Button size="sm" onClick={() => handleAddLesson(module.id)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Lesson
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
