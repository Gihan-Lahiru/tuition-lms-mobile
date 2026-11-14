import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  FileUp,
  Send,
  X,
} from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import EmptyState from '../../components/feedback/EmptyState';
import StatusBadge from '../../components/feedback/StatusBadge';
import ScoreProgressBar from '../../components/charts/ScoreProgressBar';
import { formatColomboDateTime } from '../../utils/colomboTime';

export default function StudentAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [assignments, setAssignments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selected, setSelected] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await assignmentService.getMyAssignments();
      setAssignments(res.assignments || []);
      setSummary(res.summary || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (item) => {
    setSelected(item);
    setAnswerText(item.submission?.answerText || '');
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(selected.id, { answerText, file });
      toast.success('Assignment submitted successfully!');
      setSelected(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={4} />;

  const filtered = assignments.filter((a) => {
    if (filter === 'pending') return !a.submission;
    if (filter === 'graded') return a.submission?.status === 'graded';
    return true;
  });

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Assignments</h2>
        <p className="text-xs text-slate-500">
          Upload PDF/image answers or type solutions (Due times: Asia/Colombo)
        </p>
      </div>

      {summary && (
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs">
          <ScoreProgressBar
            label={`Completion (${summary.completionRate}%)`}
            value={summary.completed}
            max={Math.max(1, summary.total)}
            tone="emerald"
          />
          <div className="mt-2 flex justify-between text-[11px] text-slate-500">
            <span>{summary.pending} pending</span>
            <span>{summary.graded} graded</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 rounded-2xl bg-slate-200/70 p-1 text-xs font-bold">
        {[
          { key: 'all', label: `All (${assignments.length})` },
          {
            key: 'pending',
            label: `Pending (${assignments.filter((a) => !a.submission).length})`,
          },
          {
            key: 'graded',
            label: `Graded (${assignments.filter((a) => a.submission?.status === 'graded').length})`,
          },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={`rounded-xl py-2 transition ${
              filter === t.key ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments in this filter"
          description="Check All assignments or wait for your teacher to post new work."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const sub = a.submission;
            const tone =
              sub?.status === 'graded'
                ? 'green'
                : sub?.isLate
                  ? 'amber'
                  : sub
                    ? 'blue'
                    : a.effectiveStatus === 'overdue'
                      ? 'red'
                      : 'slate';
            return (
              <div
                key={a.id}
                className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold text-blue-600">
                      {a.className}
                    </p>
                    <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                  </div>
                  <StatusBadge label={a.effectiveStatus} tone={tone} />
                </div>

                {a.description && (
                  <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">
                    {a.description}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Due {formatColomboDateTime(a.dueDate)}
                  </span>
                  <span className="font-semibold text-slate-700">
                    Max {a.maxMarks} marks
                  </span>
                </div>

                {sub?.status === 'graded' ? (
                  <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900">
                    <div className="flex items-center justify-between font-bold">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Score: {sub.marks} / {a.maxMarks}
                      </span>
                    </div>
                    {sub.remarks && (
                      <p className="mt-1 text-emerald-800">Teacher: {sub.remarks}</p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openModal(a)}
                    className="mt-3 w-full rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    {sub ? 'Update Submission' : 'Submit Answer'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Bottom Sheet Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setSelected(null)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[418px] rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-sheet space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="truncate text-sm font-bold text-slate-900">
                {selected.title}
              </h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full p-1.5 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Typed Answer (optional if attaching PDF/image)
              </label>
              <textarea
                rows={4}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your workings or answer here..."
                className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs">
              <span className="flex items-center gap-2 font-semibold text-slate-700">
                <FileUp className="h-4 w-4 text-blue-600" />
                {file ? file.name : 'Attach PDF / Photo (max 10 MB)'}
              </span>
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Confirm Submission'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

