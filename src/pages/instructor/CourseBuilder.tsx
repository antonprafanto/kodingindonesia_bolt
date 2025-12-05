import { useParams } from 'react-router-dom';
import CourseForm from '@/components/courses/CourseForm';

export default function CourseBuilder() {
  const { courseId } = useParams<{ courseId: string }>();
  const isEditing = !!courseId;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">
          {isEditing ? 'Edit Course' : 'Create New Course'}
        </h1>
        <p className="text-secondary-600 mt-2">
          {isEditing ? 'Update your course information' : 'Fill in the details to create your course'}
        </p>
      </div>

      <CourseForm courseId={courseId} />
    </div>
  );
}
