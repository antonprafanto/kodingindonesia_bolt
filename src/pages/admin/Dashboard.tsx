import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Users, BookOpen, GraduationCap, UserCheck, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    publishedCourses: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [enrollmentTrend, setEnrollmentTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: users } = await supabase.from('profiles').select('id');
      const { data: courses } = await supabase.from('courses').select('id, is_published');
      const { data: enrollments } = await supabase.from('enrollments').select('id, enrolled_at');

      const totalUsers = users?.length || 0;
      const totalCourses = courses?.length || 0;
      const totalEnrollments = enrollments?.length || 0;
      const publishedCourses = courses?.filter(c => c.is_published).length || 0;

      setStats({ totalUsers, totalCourses, totalEnrollments, publishedCourses });

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, 'MMM dd'),
          enrollments: 0,
        };
      });

      enrollments?.forEach((enrollment) => {
        const enrollDate = format(new Date(enrollment.enrolled_at), 'MMM dd');
        const dayData = last7Days.find(d => d.date === enrollDate);
        if (dayData) {
          dayData.enrollments++;
        }
      });

      setEnrollmentTrend(last7Days);

      const { data: recentEnrollmentsData } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrolled_at,
          user:profiles (full_name),
          course:courses (title)
        `)
        .order('enrolled_at', { ascending: false })
        .limit(10);

      setRecentActivity(recentEnrollmentsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats.totalUsers.toString(), color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: BookOpen, label: 'Total Courses', value: stats.totalCourses.toString(), color: 'text-green-600', bg: 'bg-green-50' },
    { icon: GraduationCap, label: 'Total Enrollments', value: stats.totalEnrollments.toString(), color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: Eye, label: 'Published Courses', value: stats.publishedCourses.toString(), color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-secondary-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Admin Dashboard</h1>
        <p className="text-secondary-600 mt-2">Overview of platform statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} variant="bordered">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-secondary-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card variant="bordered">
          <CardHeader>
            <h2 className="text-xl font-semibold">Enrollment Trend (Last 7 Days)</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="enrollments" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <h2 className="text-xl font-semibold">Platform Overview</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div>
                  <p className="text-sm text-secondary-600">Course Completion Rate</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stats.totalEnrollments > 0
                      ? Math.round((stats.publishedCourses / stats.totalCourses) * 100)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div>
                  <p className="text-sm text-secondary-600">Avg Enrollments per Course</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stats.totalCourses > 0
                      ? Math.round(stats.totalEnrollments / stats.totalCourses)
                      : 0}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="bordered">
        <CardHeader>
          <h2 className="text-xl font-semibold">Recent Enrollments</h2>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-secondary-600">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                      {activity.user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">
                        {activity.user?.full_name || 'Unknown'} enrolled in
                      </p>
                      <p className="text-sm text-secondary-600">{activity.course?.title}</p>
                    </div>
                  </div>
                  <p className="text-sm text-secondary-500">
                    {format(new Date(activity.enrolled_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
