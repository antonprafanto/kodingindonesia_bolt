import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle } from 'lucide-react';

interface ModuleFormProps {
  courseId: string;
  moduleData?: {
    id: string;
    title: string;
    description: string | null;
    order_index: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
  nextOrderIndex: number;
}

export default function ModuleForm({
  courseId,
  moduleData,
  onSuccess,
  onCancel,
  nextOrderIndex
}: ModuleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: moduleData?.title || '',
    description: moduleData?.description || '',
    order_index: moduleData?.order_index ?? nextOrderIndex,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (moduleData) {
        // @ts-expect-error - Database type inference issue
        const { error } = await supabase
          .from('modules')
          .update({
            title: formData.title,
            description: formData.description || null,
          })
          .eq('id', moduleData.id);

        if (error) throw error;
      } else {
        // @ts-expect-error - Database type inference issue
        const { error } = await supabase
          .from('modules')
          .insert([{
            course_id: courseId,
            title: formData.title,
            description: formData.description || null,
            order_index: formData.order_index,
          }]);

        if (error) throw error;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save module');
      console.error(err);
    } finally {
      setLoading(false);
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
        label="Module Title"
        placeholder="Introduction to React Hooks"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
          placeholder="Brief description of what students will learn in this module"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" isLoading={loading} className="flex-1">
          {moduleData ? 'Update Module' : 'Add Module'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
