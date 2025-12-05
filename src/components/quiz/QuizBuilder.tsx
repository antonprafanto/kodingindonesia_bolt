import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Question {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  points: number;
  order_index: number;
  answers: Answer[];
}

interface Answer {
  id?: string;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
}

interface QuizBuilderProps {
  lessonId: string;
  existingQuiz?: any;
  onSave: () => void;
  onCancel: () => void;
}

export default function QuizBuilder({ lessonId, existingQuiz, onSave, onCancel }: QuizBuilderProps) {
  const [title, setTitle] = useState(existingQuiz?.title || '');
  const [description, setDescription] = useState(existingQuiz?.description || '');
  const [passingScore, setPassingScore] = useState(existingQuiz?.passing_score || 70);
  const [timeLimit, setTimeLimit] = useState(existingQuiz?.time_limit_minutes || 30);
  const [questions, setQuestions] = useState<Question[]>(existingQuiz?.questions || []);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'multiple_choice',
        points: 1,
        order_index: questions.length,
        answers: [
          { answer_text: '', is_correct: false, order_index: 0 },
          { answer_text: '', is_correct: false, order_index: 1 },
        ],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addAnswer = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].answers.push({
      answer_text: '',
      is_correct: false,
      order_index: updated[questionIndex].answers.length,
    });
    setQuestions(updated);
  };

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].answers = updated[questionIndex].answers.filter((_, i) => i !== answerIndex);
    setQuestions(updated);
  };

  const updateAnswer = (questionIndex: number, answerIndex: number, field: string, value: any) => {
    const updated = [...questions];
    updated[questionIndex].answers[answerIndex] = {
      ...updated[questionIndex].answers[answerIndex],
      [field]: value,
    };
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    for (const q of questions) {
      if (!q.question_text.trim()) {
        alert('All questions must have text');
        return;
      }
      if (!q.answers.some(a => a.is_correct)) {
        alert('Each question must have at least one correct answer');
        return;
      }
    }

    setSaving(true);
    try {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .upsert({
          id: existingQuiz?.id,
          lesson_id: lessonId,
          title,
          description,
          passing_score: passingScore,
          time_limit_minutes: timeLimit || null,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      if (existingQuiz?.id) {
        await supabase.from('questions').delete().eq('quiz_id', existingQuiz.id);
      }

      for (const question of questions) {
        const { data: savedQuestion, error: questionError } = await supabase
          .from('questions')
          .insert({
            quiz_id: quiz.id,
            question_text: question.question_text,
            question_type: question.question_type,
            points: question.points,
            order_index: question.order_index,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        const answersToInsert = question.answers.map(a => ({
          question_id: savedQuestion.id,
          answer_text: a.answer_text,
          is_correct: a.is_correct,
          order_index: a.order_index,
        }));

        const { error: answersError } = await supabase
          .from('answers')
          .insert(answersToInsert);

        if (answersError) throw answersError;
      }

      onSave();
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Error saving quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quiz Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Quiz Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quiz description"
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Passing Score (%)
              </label>
              <Input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Time Limit (minutes)
              </label>
              <Input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Questions</h3>
        <Button onClick={addQuestion} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      {questions.map((question, qIndex) => (
        <Card key={qIndex} className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Question {qIndex + 1} *
                  </label>
                  <Input
                    value={question.question_text}
                    onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                    placeholder="Enter question"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Points
                  </label>
                  <Input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(qIndex, 'points', Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Answers
                </label>
                <div className="space-y-2">
                  {question.answers.map((answer, aIndex) => (
                    <div key={aIndex} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={answer.is_correct}
                        onChange={(e) =>
                          updateAnswer(qIndex, aIndex, 'is_correct', e.target.checked)
                        }
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <Input
                        value={answer.answer_text}
                        onChange={(e) =>
                          updateAnswer(qIndex, aIndex, 'answer_text', e.target.value)
                        }
                        placeholder={`Answer ${aIndex + 1}`}
                        className="flex-1"
                      />
                      {question.answers.length > 2 && (
                        <button
                          onClick={() => removeAnswer(qIndex, aIndex)}
                          className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {question.answers.length < 6 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addAnswer(qIndex)}
                    className="mt-2"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Answer
                  </Button>
                )}
              </div>
            </div>
            <button
              onClick={() => removeQuestion(qIndex)}
              className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </Card>
      ))}

      {questions.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-secondary-300 rounded-lg">
          <p className="text-secondary-600 mb-4">No questions yet</p>
          <Button onClick={addQuestion}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Question
          </Button>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-secondary-200">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Quiz'}
        </Button>
      </div>
    </div>
  );
}
