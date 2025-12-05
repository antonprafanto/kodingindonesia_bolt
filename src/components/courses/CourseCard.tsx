import { Card, CardContent } from '@/components/ui/Card';
import { BookOpen, Users, Star, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail_url: string | null;
    level: string;
    price: number;
    is_published: boolean;
    created_at: string;
  };
  showActions?: boolean;
  onEdit?: (courseId: string) => void;
  onDelete?: (courseId: string) => void;
}

export default function CourseCard({ course, showActions = false, onEdit, onDelete }: CourseCardProps) {
  const levelColors = {
    beginner: 'bg-success-100 text-success-800',
    intermediate: 'bg-warning-100 text-warning-800',
    advanced: 'bg-error-100 text-error-800',
  };

  return (
    <Card variant="bordered" className="overflow-hidden hover:shadow-lg transition-shadow">
      {course.thumbnail_url ? (
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <BookOpen className="h-16 w-16 text-white opacity-50" />
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-secondary-900 mb-1 line-clamp-2">
              {course.title}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${levelColors[course.level as keyof typeof levelColors]}`}>
                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
              </span>
              {!course.is_published && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-secondary-100 text-secondary-800">
                  Draft
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-secondary-600 text-sm mb-4 line-clamp-3">
          {course.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
          <div className="flex items-center gap-4 text-sm text-secondary-600">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>0</span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1 fill-warning-400 text-warning-400" />
              <span>0.0</span>
            </div>
          </div>
          <div className="text-lg font-bold text-primary-600">
            {course.price === 0 ? 'Free' : `$${course.price}`}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-secondary-200">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit && onEdit(course.id)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete && onDelete(course.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
