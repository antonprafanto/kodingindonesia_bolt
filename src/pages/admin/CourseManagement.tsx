import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default function CourseManagement() {
  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Course Management</h1>
          <p className="text-secondary-600 mt-2">Manage all courses on the platform</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </div>

      <Card variant="bordered">
        <CardContent>
          <p className="text-secondary-600">No courses available</p>
        </CardContent>
      </Card>
    </div>
  );
}
