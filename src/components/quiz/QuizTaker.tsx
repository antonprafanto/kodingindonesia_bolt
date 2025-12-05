import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Quiz {
  id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes: number | null;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  order_index: number;
  answers: Answer[];
}

interface Answer {
  id: string;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
}

interface QuizTakerProps {
  quizId: string;
  onComplete: () => void;
}

export default function QuizTaker({ quizId, onComplete }: QuizTakerProps) {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [passed, setPassed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !submitted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !submitted) {
      handleSubmit();
    }
  }, [timeRemaining, submitted]);

  const loadQuiz = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      if (quizData.time_limit_minutes) {
        setTimeRemaining(quizData.time_limit_minutes * 60);
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*, answers(*)')
        .eq('quiz_id', quizId)
        .order('order_index');

      if (questionsError) throw questionsError;

      const formattedQuestions = questionsData.map((q: any) => ({
        ...q,
        answers: q.answers.sort((a: any, b: any) => a.order_index - b.order_index),
      }));

      setQuestions(formattedQuestions);

      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user?.id,
          quiz_id: quizId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (attemptError) throw attemptError;
      setAttemptId(attempt.id);
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    if (question.question_type === 'multiple_choice') {
      setUserAnswers({
        ...userAnswers,
        [questionId]: [answerId],
      });
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach(question => {
      totalPoints += question.points;
      const userAnswerIds = userAnswers[question.id] || [];
      const correctAnswerIds = question.answers
        .filter(a => a.is_correct)
        .map(a => a.id);

      const isCorrect =
        userAnswerIds.length === correctAnswerIds.length &&
        userAnswerIds.every(id => correctAnswerIds.includes(id));

      if (isCorrect) {
        earnedPoints += question.points;
      }
    });

    const finalScore = Math.round((earnedPoints / totalPoints) * 100);
    const isPassed = finalScore >= (quiz?.passing_score || 70);

    setScore(finalScore);
    setPassed(isPassed);
    setSubmitted(true);

    try {
      await supabase
        .from('quiz_attempts')
        .update({
          score: finalScore,
          passed: isPassed,
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId);
    } catch (error) {
      console.error('Error updating quiz attempt:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-secondary-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          {passed ? (
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-error-600 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            {passed ? 'Congratulations!' : 'Keep Practicing'}
          </h2>
          <p className="text-secondary-600 mb-6">
            You scored {score}% on this quiz. {passed ? 'You passed!' : `You need ${quiz?.passing_score}% to pass.`}
          </p>
          <div className="bg-secondary-50 rounded-lg p-4 mb-6">
            <div className="text-4xl font-bold text-secondary-900 mb-1">{score}%</div>
            <div className="text-sm text-secondary-600">Your Score</div>
          </div>
          <Button onClick={onComplete}>Continue Learning</Button>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];
  if (!question) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">{quiz?.title}</h2>
          <p className="text-secondary-600">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
        {timeRemaining !== null && (
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Clock className={`w-5 h-5 ${timeRemaining < 60 ? 'text-error-600' : 'text-secondary-600'}`} />
            <span className={timeRemaining < 60 ? 'text-error-600' : 'text-secondary-900'}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      <div className="mb-4 bg-secondary-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <Card className="p-8 mb-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
            {currentQuestion + 1}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-secondary-900 mb-1">
              {question.question_text}
            </h3>
            <p className="text-sm text-secondary-600">Worth {question.points} point(s)</p>
          </div>
        </div>

        <div className="space-y-3">
          {question.answers.map((answer) => {
            const isSelected = userAnswers[question.id]?.includes(answer.id);
            return (
              <label
                key={answer.id}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-secondary-200 hover:border-primary-300 hover:bg-secondary-50'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  checked={isSelected}
                  onChange={() => handleAnswerSelect(question.id, answer.id)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-secondary-900">{answer.answer_text}</span>
              </label>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        {currentQuestion < questions.length - 1 ? (
          <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
            Next Question
          </Button>
        ) : (
          <Button onClick={handleSubmit}>Submit Quiz</Button>
        )}
      </div>

      {timeRemaining !== null && timeRemaining < 60 && (
        <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning-600" />
          <p className="text-warning-800">Less than 1 minute remaining!</p>
        </div>
      )}
    </div>
  );
}
