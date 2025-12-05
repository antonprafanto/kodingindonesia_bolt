import { Card, CardContent } from '@/components/ui/Card';

export default function CourseBuilder() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Course Builder</h1>
        <p className="text-secondary-600 mt-2">Create and edit your course</p>
      </div>

      <Card variant="bordered">
        <CardContent>
          <p className="text-secondary-600">Course builder interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
