import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { BookOpen, TrendingUp, Award, Clock } from 'lucide-react';

export default function StudentDashboard() {
  const stats = [
    { icon: BookOpen, label: 'Courses Enrolled', value: '5', color: 'text-primary-600' },
    { icon: TrendingUp, label: 'In Progress', value: '3', color: 'text-warning-600' },
    { icon: Award, label: 'Completed', value: '2', color: 'text-success-600' },
    { icon: Clock, label: 'Hours Learned', value: '24', color: 'text-secondary-600' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600 mt-2">Selamat datang kembali! Lanjutkan pembelajaran Anda.</p>
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
                <div className={`p-3 rounded-lg bg-secondary-100`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card variant="bordered">
        <CardHeader>
          <h2 className="text-xl font-semibold">Lanjutkan Belajar</h2>
        </CardHeader>
        <CardContent>
          <p className="text-secondary-600">Tidak ada course yang sedang dipelajari saat ini.</p>
        </CardContent>
      </Card>
    </div>
  );
}
