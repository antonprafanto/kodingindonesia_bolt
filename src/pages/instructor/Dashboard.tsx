import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, Users, Star, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface CourseStats {
  id: string;
  title: string;
  enrollments: number;
  avgProgress: number;
  rating: number;
  reviewCount: number;
}

export default function InstructorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
    avgRating: 0,
  });
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, is_published')
        .eq('instructor_id', user.id);

      if (coursesError) throw coursesError;

      const totalCourses = courses?.length || 0;
      const publishedCourses = courses?.filter(c => c.is_published).length || 0;

      const courseIds = courses?.map(c => c.id) || [];

      let totalStudents = 0;
      const courseStatsData: CourseStats[] = [];

      for (const course of courses || []) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id, progress_percentage')
          .eq('course_id', course.id);

        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('course_id', course.id);

        const enrollmentCount = enrollments?.length || 0;
        totalStudents += enrollmentCount;

        const avgProgress = enrollments?.length
          ? Math.round(
              enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) /
                enrollments.length
            )
          : 0;

        const avgRating = reviews?.length
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        courseStatsData.push({
          id: course.id,
          title: course.title,
          enrollments: enrollmentCount,
          avgProgress,
          rating: Number(avgRating.toFixed(1)),
          reviewCount: reviews?.length || 0,
        });
      }

      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .in('course_id', courseIds);

      const avgRating = allReviews?.length
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

      const { data: recentEnrollmentsData } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrolled_at,
          progress_percentage,
          user:profiles (full_name, avatar_url),
          course:courses (title)
        `)
        .in('course_id', courseIds)
        .order('enrolled_at', { ascending: false })
        .limit(5);

      setStats({
        totalCourses,
        publishedCourses,
        totalStudents,
        avgRating: Number(avgRating.toFixed(1)),
      });

      setCourseStats(courseStatsData);
      setRecentEnrollments(recentEnrollmentsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: BookOpen, label: 'Total Courses', value: stats.totalCourses.toString(), color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Eye, label: 'Published', value: stats.publishedCourses.toString(), color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Users, label: 'Total Students', value: stats.totalStudents.toString(), color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: Star, label: 'Avg Rating', value: stats.avgRating.toFixed(1), color: 'text-yellow-600', bg: 'bg-yellow-50' },
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
        <h1 className="text-3xl font-bold text-secondary-900">Instructor Dashboard</h1>
        <p className="text-secondary-600 mt-2">Track your teaching performance and student engagement</p>
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
            <h2 className="text-xl font-semibold">Course Performance</h2>
          </CardHeader>
          <CardContent>
            {courseStats.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                <p className="text-secondary-600 mb-4">No courses yet</p>
                <Button onClick={() => navigate('/instructor/courses/new')}>Create Your First Course</Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={courseStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="enrollments" fill="#3b82f6" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <h2 className="text-xl font-semibold">Average Progress by Course</h2>
          </CardHeader>
          <CardContent>
            {courseStats.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                <p className="text-secondary-600">No progress data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={courseStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgProgress" stroke="#10b981" name="Avg Progress %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="bordered">
          <CardHeader>
            <h2 className="text-xl font-semibold">Top Performing Courses</h2>
          </CardHeader>
          <CardContent>
            {courseStats.length === 0 ? (
              <p className="text-secondary-600">No courses available</p>
            ) : (
              <div className="space-y-4">
                {courseStats
                  .sort((a, b) => b.enrollments - a.enrollments)
                  .slice(0, 5)
                  .map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-secondary-900">{course.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-secondary-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {course.enrollments} students
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {course.rating || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {course.avgProgress}% avg
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <h2 className="text-xl font-semibold">Recent Enrollments</h2>
          </CardHeader>
          <CardContent>
            {recentEnrollments.length === 0 ? (
              <p className="text-secondary-600">No enrollments yet</p>
            ) : (
              <div className="space-y-3">
                {recentEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center gap-3 p-3 border border-secondary-200 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                      {enrollment.user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-secondary-900">{enrollment.user?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-secondary-600">{enrollment.course?.title}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-secondary-200 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full"
                            style={{ width: `${enrollment.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-secondary-600">{enrollment.progress_percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
