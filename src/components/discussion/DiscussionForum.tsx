import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MessageSquare, Send, Trash2, Edit2, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface Discussion {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  replies?: Discussion[];
}

interface DiscussionForumProps {
  courseId: string;
}

export default function DiscussionForum({ courseId }: DiscussionForumProps) {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadDiscussions();
  }, [courseId]);

  const loadDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from('discussions')
        .select(`
          *,
          user:profiles (id, full_name, avatar_url)
        `)
        .eq('course_id', courseId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const discussionsWithReplies = await Promise.all(
        (data || []).map(async (discussion) => {
          const { data: replies } = await supabase
            .from('discussions')
            .select(`
              *,
              user:profiles (id, full_name, avatar_url)
            `)
            .eq('parent_id', discussion.id)
            .order('created_at', { ascending: true });

          return {
            ...discussion,
            replies: replies || [],
          };
        })
      );

      setDiscussions(discussionsWithReplies);
    } catch (error) {
      console.error('Error loading discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim() || !user) return;

    setPosting(true);
    try {
      const { error } = await supabase.from('discussions').insert({
        course_id: courseId,
        user_id: user.id,
        title: newTitle,
        content: newContent,
      });

      if (error) throw error;

      setNewTitle('');
      setNewContent('');
      await loadDiscussions();
    } catch (error) {
      console.error('Error posting discussion:', error);
      alert('Error posting discussion. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (discussionId: string) => {
    if (!replyContent.trim() || !user) return;

    setPosting(true);
    try {
      const { error } = await supabase.from('discussions').insert({
        course_id: courseId,
        user_id: user.id,
        parent_id: discussionId,
        content: replyContent,
      });

      if (error) throw error;

      setReplyTo(null);
      setReplyContent('');
      await loadDiscussions();
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Error posting reply. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (discussionId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('discussions')
        .delete()
        .eq('id', discussionId);

      if (error) throw error;
      await loadDiscussions();
    } catch (error) {
      console.error('Error deleting discussion:', error);
      alert('Error deleting discussion. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-secondary-600">Loading discussions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Start a Discussion</h3>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Discussion title"
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What would you like to discuss?"
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={4}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handlePost} disabled={posting || !newTitle.trim() || !newContent.trim()}>
              <Send className="w-4 h-4 mr-2" />
              {posting ? 'Posting...' : 'Post Discussion'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {discussions.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-600">No discussions yet. Be the first to start one!</p>
          </Card>
        ) : (
          discussions.map((discussion) => (
            <Card key={discussion.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold flex-shrink-0">
                  {discussion.user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-secondary-900">{discussion.title}</h4>
                      <p className="text-sm text-secondary-600">
                        by {discussion.user?.full_name || 'Unknown'} •{' '}
                        {format(new Date(discussion.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    {user?.id === discussion.user?.id && (
                      <button
                        onClick={() => handleDelete(discussion.id)}
                        className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-secondary-700 mb-4 whitespace-pre-wrap">{discussion.content}</p>

                  {discussion.replies && discussion.replies.length > 0 && (
                    <div className="space-y-3 mb-4 pl-6 border-l-2 border-secondary-200">
                      {discussion.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-semibold flex-shrink-0">
                            {reply.user?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-secondary-900">
                                {reply.user?.full_name || 'Unknown'}
                              </p>
                              {user?.id === reply.user?.id && (
                                <button
                                  onClick={() => handleDelete(reply.id)}
                                  className="p-1 text-error-600 hover:bg-error-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-secondary-500 mb-1">
                              {format(new Date(reply.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                            <p className="text-sm text-secondary-700 whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {replyTo === discussion.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your reply..."
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReply(discussion.id)}
                          disabled={posting || !replyContent.trim()}
                        >
                          {posting ? 'Posting...' : 'Post Reply'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyTo(null);
                            setReplyContent('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReplyTo(discussion.id)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Reply ({discussion.replies?.length || 0})
                    </Button>
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
