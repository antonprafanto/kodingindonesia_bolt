import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Star, ThumbsUp, Flag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ReviewSystemProps {
  courseId: string;
  canReview: boolean;
}

export default function ReviewSystem({ courseId, canReview }: ReviewSystemProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    avgRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  useEffect(() => {
    loadReviews();
  }, [courseId, user]);

  const loadReviews = async () => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          user:profiles (full_name, avatar_url)
        `)
        .eq('course_id', courseId)
        .eq('is_moderated', true)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      if (user) {
        const { data: userReviewData } = await supabase
          .from('reviews')
          .select(`
            *,
            user:profiles (full_name, avatar_url)
          `)
          .eq('course_id', courseId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (userReviewData) {
          setUserReview(userReviewData);
          setRating(userReviewData.rating);
          setComment(userReviewData.comment || '');
        }
      }

      const totalReviews = reviewsData?.length || 0;
      const avgRating = totalReviews > 0
        ? reviewsData!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviewsData?.forEach((review) => {
        distribution[review.rating as keyof typeof distribution]++;
      });

      setStats({ avgRating, totalReviews, distribution });
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !canReview) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('reviews').upsert({
        id: userReview?.id,
        course_id: courseId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
        is_moderated: true,
      });

      if (error) throw error;

      setShowForm(false);
      await loadReviews();
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Error saving review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : ''}
          >
            <Star
              className={`w-5 h-5 ${
                star <= (interactive ? hoveredRating || rating : count)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-secondary-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-secondary-900 mb-2">
              {stats.avgRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(stats.avgRating))}
            </div>
            <p className="text-secondary-600">{stats.totalReviews} reviews</p>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium text-secondary-700">{star}</span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 bg-secondary-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{
                      width: `${stats.totalReviews > 0 ? (stats.distribution[star as keyof typeof stats.distribution] / stats.totalReviews) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm text-secondary-600 w-8">
                  {stats.distribution[star as keyof typeof stats.distribution]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {canReview && (
        <Card className="p-6">
          {!showForm && !userReview ? (
            <div className="text-center">
              <p className="text-secondary-600 mb-4">Share your experience with this course</p>
              <Button onClick={() => setShowForm(true)}>Write a Review</Button>
            </div>
          ) : !showForm && userReview ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Your Review</h3>
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                  Edit Review
                </Button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {renderStars(userReview.rating)}
              </div>
              {userReview.comment && (
                <p className="text-secondary-700">{userReview.comment}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {userReview ? 'Edit Your Review' : 'Write a Review'}
              </h3>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Rating *
                </label>
                {renderStars(rating, true)}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell others about your experience..."
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? 'Saving...' : 'Submit Review'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    if (userReview) {
                      setRating(userReview.rating);
                      setComment(userReview.comment || '');
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Student Reviews</h3>
        {reviews.length === 0 ? (
          <Card className="p-12 text-center">
            <Star className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-600">No reviews yet. Be the first to review this course!</p>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold flex-shrink-0">
                  {review.user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-secondary-900">
                        {review.user?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-secondary-600">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex">{renderStars(review.rating)}</div>
                  </div>
                  {review.comment && (
                    <p className="text-secondary-700 whitespace-pre-wrap">{review.comment}</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
