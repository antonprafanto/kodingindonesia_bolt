import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyCourses() {
  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">My Courses</h1>
          <p className="text-secondary-600 mt-2">Manage your courses</p>
        </div>
        <Link to="/instructor/courses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      <Card variant="bordered">
        <CardContent>
          <p className="text-secondary-600">You haven't created any courses yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
