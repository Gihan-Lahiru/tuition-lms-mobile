import { useEffect, useState } from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { resultService } from '../../services/resultService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import EmptyState from '../../components/feedback/EmptyState';
import StatusBadge from '../../components/feedback/StatusBadge';
import ScoreProgressBar from '../../components/charts/ScoreProgressBar';
import { getGradeBadge } from '../../utils/gradeUtils';

export default function StudentResultsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedTermId, setSelectedTermId] = useState('all');

  useEffect(() => {
    resultService
      .getMyResults()
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton rows={4} />;

  const results = data?.results || [];
  const summary = data?.summary || {};
  const quizHistory = data?.quizHistory || [];

  const uniqueTerms = Array.from(
    new Map(results.map((r) => [r.termId, r.termName])).entries(),
  );
  const visibleResults =
    selectedTermId === 'all'
      ? results
      : results.filter((r) => r.termId === selectedTermId);

  const avgBadge = getGradeBadge(summary.termAveragePercentage);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Term Marks &amp; Progress
        </h2>
        <p className="text-xs text-slate-500">
          Published exam marks, quiz average &amp; assignment completion
        </p>
      </div>

      {/* Report Summary Card */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-800 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-100">Published Term Average</p>
            <p className="mt-1 text-3xl font-black">
              {summary.termAveragePercentage !== null &&
              summary.termAveragePercentage !== undefined
                ? `${summary.termAveragePercentage}%`
                : '—'}
            </p>
          </div>
          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-white/15">
            <span className="text-xl font-black">
              {summary.overallGradeLetter || avgBadge.letter}
            </span>
            <span className="text-[10px] text-blue-100">Band</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-blue-100">Assignments</p>
            <p className="mt-0.5 text-sm font-bold">
              {summary.assignmentsCompleted || 0}/{summary.assignmentsTotal || 0}{' '}
              ({summary.assignmentCompletionRate || 0}%)
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-blue-100">MCQ Quizzes Avg</p>
            <p className="mt-0.5 text-sm font-bold">
              {summary.quizAveragePercentage !== null &&
              summary.quizAveragePercentage !== undefined
                ? `${summary.quizAveragePercentage}% (${summary.quizzesCompleted})`
                : 'No attempts'}
            </p>
          </div>
        </div>
      </div>

      {uniqueTerms.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedTermId('all')}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold ${
              selectedTermId === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All Terms
          </button>
          {uniqueTerms.map(([id, name]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedTermId(id)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold ${
                selectedTermId === id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {visibleResults.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No published term marks yet"
          description="Marks appear here only after your teacher publishes them."
        />
      ) : (
        <div className="space-y-3">
          {visibleResults.map((r) => (
            <div
              key={r.id}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold text-blue-600">
                    {r.termName}
                  </p>
                  <h3 className="text-sm font-bold text-slate-900">
                    {r.subject || r.className}
                  </h3>
                </div>
                {r.status === 'graded' ? (
                  <span
                    className={`rounded-xl px-2.5 py-1 text-xs font-extrabold ${
                      getGradeBadge(r.percentage).color
                    }`}
                  >
                    Grade {r.gradeLetter}
                  </span>
                ) : (
                  <StatusBadge
                    label={r.status === 'absent' ? 'Absent' : 'Not Graded'}
                    tone="amber"
                  />
                )}
              </div>

              {r.status === 'graded' && (
                <ScoreProgressBar
                  value={r.marks}
                  max={r.maxMarks}
                  label={`${r.percentage}%`}
                  tone="blue"
                />
              )}

              {r.remarks && (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Remarks: {r.remarks}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {quizHistory.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Quiz Score History</span>
          </div>
          <div className="mt-3 space-y-2">
            {quizHistory.map((q) => (
              <div
                key={q.attemptId}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5 text-xs"
              >
                <span className="font-semibold text-slate-800">{q.quizTitle}</span>
                <span className="font-bold text-blue-700">
                  {q.score}/{q.maxScore} ({q.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

