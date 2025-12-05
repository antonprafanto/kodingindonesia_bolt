import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Users, BookOpen, DollarSign, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { icon: Users, label: 'Total Users', value: '1,234', color: 'text-primary-600' },
    { icon: BookOpen, label: 'Total Courses', value: '156', color: 'text-warning-600' },
    { icon: DollarSign, label: 'Revenue', value: '$12,345', color: 'text-success-600' },
    { icon: TrendingUp, label: 'Growth', value: '+15%', color: 'text-primary-600' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Admin Dashboard</h1>
        <p className="text-secondary-600 mt-2">Overview of platform statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} variant="bordered">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-secondary-900">{stat.value}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary-100">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card variant="bordered">
        <CardHeader>
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </CardHeader>
        <CardContent>
          <p className="text-secondary-600">No recent activity</p>
        </CardContent>
      </Card>
    </div>
  );
}
