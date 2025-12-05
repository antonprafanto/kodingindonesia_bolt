import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertCircle } from 'lucide-react';

interface CourseFormProps {
  courseId?: string;
  onSuccess?: () => void;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CourseForm({ courseId, onSuccess }: CourseFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category_id: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    price: 0,
    is_published: false,
  });

  useEffect(() => {
    fetchCategories();
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchCourse = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const courseData = data as any;
        setFormData({
          title: courseData.title || '',
          slug: courseData.slug || '',
          description: courseData.description || '',
          category_id: courseData.category_id || '',
          level: (courseData.level as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
          price: courseData.price || 0,
          is_published: courseData.is_published || false,
        });
      }
    } catch (err) {
      setError('Failed to load course data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) throw new Error('Not authenticated');

      const courseData = {
        ...formData,
        instructor_id: user.id,
        category_id: formData.category_id || null,
      };

      if (courseId) {
        const { error } = await supabase
          .from('courses')
          // @ts-expect-error - Database type inference issue
          .update(courseData)
          .eq('id', courseId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('courses')
          // @ts-expect-error - Database type inference issue
          .insert([courseData]);

        if (error) throw error;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/instructor/courses');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save course');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="bordered">
      <CardContent>
        {error && (
          <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-error-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Course Title"
            placeholder="Introduction to React"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
          />

          <Input
            label="Slug (URL-friendly)"
            placeholder="introduction-to-react"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            helperText="Auto-generated from title, but you can customize it"
            required
          />

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={5}
              placeholder="Describe what students will learn in this course..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Category
            </label>
            <select
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Level
            </label>
            <select
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <Input
            type="number"
            label="Price (0 for free)"
            placeholder="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
            required
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_published"
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
            />
            <label htmlFor="is_published" className="ml-2 text-sm text-secondary-700">
              Publish course (make it visible to students)
            </label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" isLoading={loading} className="flex-1">
              {courseId ? 'Update Course' : 'Create Course'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/instructor/courses')}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
