import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle } from 'lucide-react';

interface LessonFormProps {
  moduleId: string;
  lessonId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CONTENT_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'text', label: 'Text/Article' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'resource', label: 'Resource/Download' },
];

export default function LessonForm({
  moduleId,
  lessonId,
  onSuccess,
  onCancel
}: LessonFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content_type: 'video' as string,
    content: '',
    duration_minutes: 0,
    is_preview: false,
  });

  useEffect(() => {
    if (lessonId) {
      loadLessonData();
    }
  }, [lessonId]);

  const loadLessonData = async () => {
    if (!lessonId) return;

    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          title: (data as any).title,
          content_type: (data as any).content_type,
          content: (data as any).content || '',
          duration_minutes: (data as any).duration_minutes || 0,
          is_preview: (data as any).is_preview || false,
        });
      }
    } catch (err) {
      console.error('Error loading lesson:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (lessonId) {
        const { error } = await supabase
          .from('lessons')
          // @ts-expect-error - Database type inference issue
          .update({
            title: formData.title,
            content_type: formData.content_type,
            content: formData.content || null,
            duration_minutes: formData.duration_minutes || null,
            is_preview: formData.is_preview,
          })
          .eq('id', lessonId);

        if (error) throw error;
      } else {
        const { data: maxOrder } = await supabase
          .from('lessons')
          .select('order_index')
          .eq('module_id', moduleId)
          .order('order_index', { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextOrderIndex = ((maxOrder as any)?.order_index ?? -1) + 1;

        const { error } = await supabase
          .from('lessons')
          .insert([{
            module_id: moduleId,
            title: formData.title,
            content_type: formData.content_type,
            content: formData.content || null,
            duration_minutes: formData.duration_minutes || null,
            is_preview: formData.is_preview,
            order_index: nextOrderIndex,
          }] as any);

        if (error) throw error;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save lesson');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderContentInput = () => {
    switch (formData.content_type) {
      case 'video':
        return (
          <Input
            label="Video URL"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            helperText="YouTube, Vimeo, or direct video URL"
          />
        );

      case 'text':
        return (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Content
            </label>
            <textarea
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={8}
              placeholder="Write your lesson content here..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            <p className="text-xs text-secondary-500 mt-1">
              Supports markdown formatting
            </p>
          </div>
        );

      case 'quiz':
        return (
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="text-sm text-primary-900">
              Quiz questions will be managed separately after creating the lesson
            </p>
          </div>
        );

      case 'assignment':
        return (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Assignment Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={6}
              placeholder="Describe the assignment requirements..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>
        );

      case 'resource':
        return (
          <Input
            label="Resource URL"
            type="url"
            placeholder="https://example.com/resource.pdf"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            helperText="Link to downloadable resource"
          />
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-error-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error-800">{error}</p>
        </div>
      )}

      <Input
        label="Lesson Title"
        placeholder="Introduction to Hooks"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Content Type
        </label>
        <select
          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={formData.content_type}
          onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
          required
        >
          {CONTENT_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {renderContentInput()}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Duration (minutes)"
          type="number"
          min="0"
          placeholder="15"
          value={formData.duration_minutes.toString()}
          onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
        />

        <div className="flex items-end">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_preview}
              onChange={(e) => setFormData({ ...formData, is_preview: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-secondary-700">
              Free Preview
            </span>
          </label>
        </div>
      </div>

      <p className="text-xs text-secondary-500">
        Free preview lessons can be viewed by non-enrolled students
      </p>

      <div className="flex gap-3 pt-2">
        <Button type="submit" isLoading={loading} className="flex-1">
          {lessonId ? 'Update Lesson' : 'Add Lesson'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
