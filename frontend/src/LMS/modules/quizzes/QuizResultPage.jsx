import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { quizService } from '../../services/quizService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import StatusBadge from '../../components/feedback/StatusBadge';

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    quizService
      .getAttemptResult(attemptId)
      .then((res) => setResult(res))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <LoadingSkeleton rows={4} />;
  if (!result) {
    return (
      <div className="p-4 text-center text-sm text-slate-600">
        Quiz result not found.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Link
        to="/lms/quizzes"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Quizzes
      </Link>

      <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-sm">
        <StatusBadge label={result.status} tone="slate" />
        <h2 className="mt-2 text-lg font-extrabold">{result.quizTitle}</h2>
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-black">
              {result.score} / {result.maxScore}
            </p>
            <p className="text-xs text-emerald-100">Authoritative Server Score</p>
          </div>
          <p className="text-2xl font-extrabold">{result.percentage}%</p>
        </div>
      </div>

      {!result.answersReleased && (
        <div className="rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-800">
          Answer key and explanations are currently hidden by your teacher.
        </div>
      )}

      <div className="space-y-3">
        {(result.breakdown || []).map((item, idx) => (
          <div
            key={item.questionId}
            className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900">
                  {idx + 1}. {item.prompt}
                </p>
                <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {item.questionType === 'multiple_choice'
                    ? 'Multiple Choice (Exact Match)'
                    : 'Single Choice'}
                </span>
              </div>
              {item.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
              )}
            </div>

            <div className="mt-2.5 space-y-1.5">
              {(item.options || []).map((opt) => {
                const selectedIds = Array.isArray(item.selectedOptionIds)
                  ? item.selectedOptionIds
                  : item.selectedOptionId
                    ? [item.selectedOptionId]
                    : [];
                const picked = selectedIds.includes(opt.id);
                const correct = result.answersReleased && opt.isCorrect;
                return (
                  <div
                    key={opt.id}
                    className={`rounded-xl px-3 py-2 text-xs ${
                      correct
                        ? 'bg-emerald-50 font-bold text-emerald-800 border border-emerald-200'
                        : picked
                          ? 'bg-rose-50 font-semibold text-rose-800 border border-rose-200'
                          : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    {opt.label}
                    {picked && ' (Your answer)'}
                    {correct && ' ✓ Correct'}
                  </div>
                );
              })}
            </div>

            {result.answersReleased && item.explanation && (
              <p className="mt-2 text-[11px] text-slate-500">
                Explanation: {item.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

