import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  CheckCircle,
  Circle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  FileText,
  ClipboardList,
  Download,
  Menu,
  X,
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  content: string | null;
  duration_minutes: number | null;
  order_index: number;
}

interface Progress {
  lesson_id: string;
  completed: boolean;
  progress_percentage: number;
}

export default function LearningInterface() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && user) {
      loadCourseData();
      loadProgress();
    }
  }, [courseId, user]);

  const loadCourseData = async () => {
    if (!courseId) return;

    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*, lessons(*)')
        .eq('course_id', courseId)
        .order('order_index');

      if (modulesError) throw modulesError;

      const formattedModules = (modulesData as any[]).map((m: any) => ({
        id: m.id,
        title: m.title,
        order_index: m.order_index,
        lessons: (m.lessons || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((l: any) => ({
            id: l.id,
            title: l.title,
            content_type: l.content_type,
            content: l.content,
            duration_minutes: l.duration_minutes,
            order_index: l.order_index,
          })),
      }));

      setModules(formattedModules);

      if (formattedModules.length > 0 && formattedModules[0].lessons.length > 0) {
        setCurrentLesson(formattedModules[0].lessons[0]);
        setExpandedModules(new Set([formattedModules[0].id]));
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!courseId || !user) return;

    try {
      const { data: modulesData } = await supabase
        .from('modules')
        .select('lessons(id)')
        .eq('course_id', courseId);

      const lessonIds = (modulesData as any[])?.flatMap(m =>
        m.lessons?.map((l: any) => l.id) || []
      ) || [];

      if (lessonIds.length === 0) return;

      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      if (error) throw error;

      const progressMap: Record<string, Progress> = {};
      (data as any[])?.forEach((p: any) => {
        progressMap[p.lesson_id] = {
          lesson_id: p.lesson_id,
          completed: p.completed,
          progress_percentage: p.progress_percentage,
        };
      });

      setProgress(progressMap);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user || !courseId) return;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          lesson_id: lessonId,
          user_id: user.id,
          completed: true,
          completed_at: new Date().toISOString(),
        } as any);

      if (error) throw error;

      setProgress(prev => ({
        ...prev,
        [lessonId]: {
          lesson_id: lessonId,
          completed: true,
          progress_percentage: 100,
        },
      }));

      await updateEnrollmentProgress();
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const updateEnrollmentProgress = async () => {
    if (!user || !courseId) return;

    try {
      const { data: modulesData } = await supabase
        .from('modules')
        .select('lessons(id)')
        .eq('course_id', courseId);

      const totalLessons = (modulesData as any[])?.reduce((acc, m) =>
        acc + (m.lessons?.length || 0), 0
      ) || 0;

      if (totalLessons === 0) return;

      const completedLessons = Object.values(progress).filter(p => p.completed).length;
      const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

      await supabase
        .from('enrollments')
        .update({ progress_percentage: progressPercentage } as any)
        .eq('user_id', user.id)
        .eq('course_id', courseId);
    } catch (error) {
      console.error('Error updating enrollment progress:', error);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const findNextLesson = (): Lesson | null => {
    if (!currentLesson) return null;

    for (const module of modules) {
      const currentIndex = module.lessons.findIndex(l => l.id === currentLesson.id);
      if (currentIndex !== -1) {
        if (currentIndex < module.lessons.length - 1) {
          return module.lessons[currentIndex + 1];
        }
        const nextModuleIndex = modules.findIndex(m => m.id === module.id) + 1;
        if (nextModuleIndex < modules.length && modules[nextModuleIndex].lessons.length > 0) {
          return modules[nextModuleIndex].lessons[0];
        }
        return null;
      }
    }
    return null;
  };

  const findPrevLesson = (): Lesson | null => {
    if (!currentLesson) return null;

    for (const module of modules) {
      const currentIndex = module.lessons.findIndex(l => l.id === currentLesson.id);
      if (currentIndex !== -1) {
        if (currentIndex > 0) {
          return module.lessons[currentIndex - 1];
        }
        const prevModuleIndex = modules.findIndex(m => m.id === module.id) - 1;
        if (prevModuleIndex >= 0 && modules[prevModuleIndex].lessons.length > 0) {
          const prevModule = modules[prevModuleIndex];
          return prevModule.lessons[prevModule.lessons.length - 1];
        }
        return null;
      }
    }
    return null;
  };

  const handleNextLesson = () => {
    const next = findNextLesson();
    if (next) {
      setCurrentLesson(next);
    }
  };

  const handlePrevLesson = () => {
    const prev = findPrevLesson();
    if (prev) {
      setCurrentLesson(prev);
    }
  };

  const renderLessonContent = () => {
    if (!currentLesson) {
      return (
        <div className="text-center py-12">
          <p className="text-secondary-600">Select a lesson to begin learning</p>
        </div>
      );
    }

    const isCompleted = progress[currentLesson.id]?.completed;

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded font-medium">
                {currentLesson.content_type.toUpperCase()}
              </span>
              {currentLesson.duration_minutes && (
                <span className="text-sm text-secondary-600">
                  {currentLesson.duration_minutes} minutes
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              {currentLesson.title}
            </h1>
          </div>
          <Button
            variant={isCompleted ? 'outline' : 'primary'}
            size="sm"
            onClick={() => markLessonComplete(currentLesson.id)}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 mr-2" />
                Mark Complete
              </>
            )}
          </Button>
        </div>

        <Card className="p-6">
          {currentLesson.content_type === 'video' && currentLesson.content && (
            <div className="aspect-video bg-secondary-900 rounded-lg overflow-hidden">
              <iframe
                src={getVideoEmbedUrl(currentLesson.content)}
                className="w-full h-full"
                allowFullScreen
                title={currentLesson.title}
              />
            </div>
          )}

          {currentLesson.content_type === 'text' && (
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap">{currentLesson.content}</div>
            </div>
          )}

          {currentLesson.content_type === 'quiz' && (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Quiz Available
              </h3>
              <p className="text-secondary-600 mb-6">
                Test your knowledge with this quiz
              </p>
              <Button>Start Quiz</Button>
            </div>
          )}

          {currentLesson.content_type === 'assignment' && (
            <div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                Assignment
              </h3>
              <div className="prose max-w-none mb-6">
                <p>{currentLesson.content}</p>
              </div>
              <Button>Submit Assignment</Button>
            </div>
          )}

          {currentLesson.content_type === 'resource' && currentLesson.content && (
            <div className="text-center py-12">
              <Download className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Downloadable Resource
              </h3>
              <p className="text-secondary-600 mb-6">
                Access additional materials for this lesson
              </p>
              <a
                href={currentLesson.content}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Resource
              </a>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between pt-6 border-t border-secondary-200">
          <Button
            variant="outline"
            onClick={handlePrevLesson}
            disabled={!findPrevLesson()}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous Lesson
          </Button>
          <Button
            onClick={handleNextLesson}
            disabled={!findNextLesson()}
          >
            Next Lesson
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const getVideoEmbedUrl = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtube.com')
        ? new URL(url).searchParams.get('v')
        : url.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  const getLessonIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <PlayCircle className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'quiz':
        return <ClipboardList className="w-4 h-4" />;
      case 'resource':
        return <Download className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-secondary-600">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-secondary-50">
      <div
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 bg-white border-r border-secondary-200 overflow-hidden flex-shrink-0`}
      >
        <div className="h-full overflow-y-auto">
          <div className="p-4 border-b border-secondary-200">
            <h2 className="font-semibold text-secondary-900 mb-1">{course?.title}</h2>
            <p className="text-sm text-secondary-600">Course Content</p>
          </div>

          <div className="p-2">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="mb-2">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-secondary-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-secondary-500">
                      {moduleIndex + 1}
                    </span>
                    <span className="font-medium text-secondary-900 text-sm">
                      {module.title}
                    </span>
                  </div>
                  {expandedModules.has(module.id) ? (
                    <ChevronUp className="w-4 h-4 text-secondary-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-secondary-400" />
                  )}
                </button>

                {expandedModules.has(module.id) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isActive = currentLesson?.id === lesson.id;
                      const isComplete = progress[lesson.id]?.completed;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setCurrentLesson(lesson)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left ${
                            isActive
                              ? 'bg-primary-50 text-primary-900'
                              : 'hover:bg-secondary-50 text-secondary-700'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                          )}
                          <span className="text-xs text-secondary-500 flex-shrink-0">
                            {lessonIndex + 1}.
                          </span>
                          <span className="text-sm flex-1 truncate">{lesson.title}</span>
                          <span className="text-secondary-400 flex-shrink-0">
                            {getLessonIcon(lesson.content_type)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mb-6 p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {renderLessonContent()}
        </div>
      </div>
    </div>
  );
}
