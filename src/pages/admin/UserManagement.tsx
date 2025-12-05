import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserPlus } from 'lucide-react';

export default function UserManagement() {
  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">User Management</h1>
          <p className="text-secondary-600 mt-2">Manage all platform users</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card variant="bordered">
        <CardContent>
          <p className="text-secondary-600">No users to display</p>
        </CardContent>
      </Card>
    </div>
  );
}
