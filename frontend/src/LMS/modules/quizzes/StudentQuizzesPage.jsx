import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, ChevronRight, Clock, PlayCircle } from 'lucide-react';
import { quizService } from '../../services/quizService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import EmptyState from '../../components/feedback/EmptyState';
import StatusBadge from '../../components/feedback/StatusBadge';

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quizService
      .listQuizzes()
      .then((list) => setQuizzes(list || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Timed MCQ Quizzes</h2>
        <p className="text-xs text-slate-500">
          Server-enforced timers • Answers auto-save as you tap
        </p>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No quizzes published"
          description="Your teacher has not published any quizzes for your grade yet."
        />
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => {
            const completed = q.latestCompletedAttempt;
            const canRetry = q.attemptCount < q.maxAttempts || Boolean(q.activeAttemptId);
            return (
              <div
                key={q.id}
                className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold text-indigo-600">
                      {q.className}
                    </p>
                    <h3 className="text-sm font-bold text-slate-900">{q.title}</h3>
                  </div>
                  <StatusBadge
                    label={`${q.durationMinutes} min`}
                    tone="indigo"
                  />
                </div>
                {q.description && (
                  <p className="mt-1.5 text-xs text-slate-600">{q.description}</p>
                )}

                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                  <span>{q.questionCount} questions</span>
                  <span>• {q.totalMarks} marks</span>
                  <span>
                    • Attempts: {q.attemptCount}/{q.maxAttempts}
                  </span>
                </div>

                {completed && (
                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-emerald-50 px-3.5 py-2.5 text-xs">
                    <span className="font-bold text-emerald-800">
                      Latest Score: {completed.score}/{completed.maxScore} (
                      {completed.percentage}%)
                    </span>
                    <Link
                      to={`/lms/quiz-result/${completed.id}`}
                      className="font-bold text-emerald-700 underline"
                    >
                      Review
                    </Link>
                  </div>
                )}

                <div className="mt-3">
                  {q.activeAttemptId ? (
                    <Link
                      to={`/lms/quizzes/${q.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-2.5 text-xs font-bold text-white"
                    >
                      <Clock className="h-4 w-4" />
                      Resume In-Progress Attempt
                    </Link>
                  ) : canRetry ? (
                    <Link
                      to={`/lms/quizzes/${q.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      <PlayCircle className="h-4 w-4" />
                      {completed ? 'Retake Quiz' : 'Start Timed Quiz'}
                    </Link>
                  ) : (
                    <Link
                      to={
                        completed
                          ? `/lms/quiz-result/${completed.id}`
                          : '/lms/quizzes'
                      }
                      className="flex w-full items-center justify-center gap-1 rounded-2xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700"
                    >
                      <span>View Final Result</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

