import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, Clock, BarChart, Star, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  level: string;
  price: number;
  instructor_id: string;
  created_at: string;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

interface Instructor {
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
      if (user) {
        checkEnrollment();
      }
    }
  }, [courseId, user]);

  const fetchCourseDetails = async () => {
    if (!courseId) return;

    try {
      setLoading(true);

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError) throw courseError;
      if (!courseData) {
        setError('Course not found');
        return;
      }

      setCourse(courseData as any);

      const { data: instructorData } = await supabase
        .from('profiles')
        .select('full_name, bio, avatar_url')
        .eq('id', (courseData as any).instructor_id)
        .maybeSingle();

      setInstructor(instructorData as any);

      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, title, description, order_index')
        .eq('course_id', courseId)
        .order('order_index');

      setModules((modulesData as any) || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching course details:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    if (!user?.id || !courseId) return;

    try {
      const { data } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      setIsEnrolled(!!data);
    } catch (err) {
      console.error('Error checking enrollment:', err);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!courseId) return;

    try {
      setEnrolling(true);
      const { error } = await supabase
        .from('enrollments')
        .insert([{
          user_id: user.id,
          course_id: courseId,
        }] as any);

      if (error) throw error;

      setIsEnrolled(true);
      navigate(`/student/learn/${courseId}`);
    } catch (err: any) {
      alert('Failed to enroll: ' + err.message);
      console.error('Error enrolling:', err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    navigate(`/student/learn/${courseId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <Card variant="bordered">
        <CardContent className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-error-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            {error || 'Course not found'}
          </h3>
          <Button onClick={() => navigate('/student/courses')}>
            Back to Catalog
          </Button>
        </CardContent>
      </Card>
    );
  }

  const levelColors = {
    beginner: 'bg-success-100 text-success-800',
    intermediate: 'bg-warning-100 text-warning-800',
    advanced: 'bg-error-100 text-error-800',
  };

  return (
    <div className="max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <BookOpen className="h-24 w-24 text-white opacity-50" />
            </div>
          )}

          <Card variant="bordered" className="mt-6">
            <CardHeader>
              <h1 className="text-3xl font-bold text-secondary-900">{course.title}</h1>
              <div className="flex items-center gap-3 mt-3">
                <span className={`px-3 py-1 rounded text-sm font-medium ${levelColors[course.level as keyof typeof levelColors]}`}>
                  {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                </span>
                <div className="flex items-center text-secondary-600">
                  <Star className="h-4 w-4 mr-1 fill-warning-400 text-warning-400" />
                  <span>0.0 (0 reviews)</span>
                </div>
                <div className="flex items-center text-secondary-600">
                  <Users className="h-4 w-4 mr-1" />
                  <span>0 students</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h2 className="text-xl font-semibold text-secondary-900 mb-3">About this course</h2>
              <p className="text-secondary-700 whitespace-pre-line">{course.description}</p>
            </CardContent>
          </Card>

          {modules.length > 0 && (
            <Card variant="bordered" className="mt-6">
              <CardHeader>
                <h2 className="text-xl font-semibold text-secondary-900">Course Content</h2>
                <p className="text-sm text-secondary-600 mt-1">
                  {modules.length} {modules.length === 1 ? 'module' : 'modules'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {modules.map((module, index) => (
                    <div
                      key={module.id}
                      className="p-4 border border-secondary-200 rounded-lg hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          <span className="text-sm font-semibold text-primary-600">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-secondary-900">{module.title}</h3>
                          {module.description && (
                            <p className="text-sm text-secondary-600 mt-1">{module.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card variant="elevated" className="sticky top-6">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {course.price === 0 ? 'FREE' : `$${course.price}`}
                </div>
                {course.price > 0 && (
                  <p className="text-sm text-secondary-600">One-time payment</p>
                )}
              </div>

              {isEnrolled ? (
                <Button
                  onClick={handleStartLearning}
                  className="w-full mb-4"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Continue Learning
                </Button>
              ) : (
                <Button
                  onClick={handleEnroll}
                  className="w-full mb-4"
                  size="lg"
                  isLoading={enrolling}
                >
                  Enroll Now
                </Button>
              )}

              <div className="space-y-3 pt-6 border-t border-secondary-200">
                <div className="flex items-center text-secondary-700">
                  <Clock className="h-5 w-5 mr-3 text-secondary-500" />
                  <span>Self-paced learning</span>
                </div>
                <div className="flex items-center text-secondary-700">
                  <BookOpen className="h-5 w-5 mr-3 text-secondary-500" />
                  <span>{modules.length} modules</span>
                </div>
                <div className="flex items-center text-secondary-700">
                  <BarChart className="h-5 w-5 mr-3 text-secondary-500" />
                  <span>{course.level.charAt(0).toUpperCase() + course.level.slice(1)} level</span>
                </div>
                <div className="flex items-center text-secondary-700">
                  <CheckCircle className="h-5 w-5 mr-3 text-secondary-500" />
                  <span>Certificate of completion</span>
                </div>
              </div>

              {instructor && (
                <div className="mt-6 pt-6 border-t border-secondary-200">
                  <h3 className="text-sm font-semibold text-secondary-900 mb-3">Instructor</h3>
                  <div className="flex items-center">
                    {instructor.avatar_url ? (
                      <img
                        src={instructor.avatar_url}
                        alt={instructor.full_name}
                        className="w-12 h-12 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <span className="text-primary-600 font-semibold">
                          {instructor.full_name?.charAt(0) || 'I'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-secondary-900">{instructor.full_name}</p>
                      {instructor.bio && (
                        <p className="text-xs text-secondary-600 line-clamp-2">{instructor.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
