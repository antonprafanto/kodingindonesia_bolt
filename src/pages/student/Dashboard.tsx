import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, TrendingUp, Award, Clock, PlayCircle, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface EnrolledCourse {
  id: string;
  enrolled_at: string;
  progress_percentage: number;
  completed_at: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string;
    instructor: {
      full_name: string;
    };
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    hoursLearned: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEnrollments();
    }
  }, [user]);

  const loadEnrollments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrolled_at,
          progress_percentage,
          completed_at,
          course:courses (
            id,
            title,
            slug,
            thumbnail_url,
            instructor:profiles (full_name)
          )
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      const enrollmentsData = (data || []) as any[];
      setEnrollments(enrollmentsData);

      const total = enrollmentsData.length;
      const completed = enrollmentsData.filter(e => e.completed_at).length;
      const inProgress = total - completed;
      const hoursLearned = Math.round(enrollmentsData.reduce((acc, e) =>
        acc + (e.progress_percentage * 0.3), 0
      ));

      setStats({ total, inProgress, completed, hoursLearned });
    } catch (error) {
      console.error('Error loading enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const continueLesson = (courseSlug: string) => {
    navigate(`/student/course/${courseSlug}/learn`);
  };

  const statCards = [
    { icon: BookOpen, label: 'Courses Enrolled', value: stats.total.toString(), color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: TrendingUp, label: 'In Progress', value: stats.inProgress.toString(), color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: Award, label: 'Completed', value: stats.completed.toString(), color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Clock, label: 'Hours Learned', value: stats.hoursLearned.toString(), color: 'text-slate-600', bg: 'bg-slate-50' },
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
        <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600 mt-2">Welcome back! Continue your learning journey.</p>
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

      <Card variant="bordered" className="mb-8">
        <CardHeader>
          <h2 className="text-xl font-semibold">Continue Learning</h2>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600 mb-4">You haven't enrolled in any courses yet.</p>
              <Button onClick={() => navigate('/student/courses')}>Browse Courses</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments
                .filter(e => !e.completed_at)
                .slice(0, 3)
                .map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 border border-secondary-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <img
                      src={enrollment.course.thumbnail_url || 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={enrollment.course.title}
                      className="w-full sm:w-32 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-secondary-900 mb-1">
                        {enrollment.course.title}
                      </h3>
                      <p className="text-sm text-secondary-600 mb-2">
                        by {enrollment.course.instructor?.full_name || 'Instructor'}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-secondary-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${enrollment.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-secondary-700">
                          {enrollment.progress_percentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-secondary-500">
                        <Calendar className="w-3 h-3" />
                        Started {format(new Date(enrollment.enrolled_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        onClick={() => continueLesson(enrollment.course.slug)}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Continue
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {enrollments.filter(e => e.completed_at).length > 0 && (
        <Card variant="bordered">
          <CardHeader>
            <h2 className="text-xl font-semibold">Completed Courses</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments
                .filter(e => e.completed_at)
                .map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="border border-secondary-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <img
                      src={enrollment.course.thumbnail_url || 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={enrollment.course.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-secondary-900 mb-1">
                        {enrollment.course.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-secondary-500">
                        <Award className="w-3 h-3 text-green-600" />
                        Completed {format(new Date(enrollment.completed_at!), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
