import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, Download, Plus } from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { contentService } from '../../services/contentService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import StatusBadge from '../../components/feedback/StatusBadge';
import { formatColomboDateTime } from '../../utils/colomboTime';

export default function TeacherAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({
    classId: '',
    title: '',
    description: '',
    maxMarks: 50,
    dueDate: '',
  });
  const [gradeInputs, setGradeInputs] = useState({});

  const load = async () => {
    try {
      const [aRes, cls] = await Promise.all([
        assignmentService.getMyAssignments(),
        contentService.getMyClasses(),
      ]);
      setAssignments(aRes.assignments || []);
      setClasses(cls || []);
      if (cls?.length && !newForm.classId) {
        setNewForm((prev) => ({ ...prev, classId: cls[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createAssignment = async (e) => {
    e.preventDefault();
    try {
      await assignmentService.createAssignment(newForm.classId, {
        title: newForm.title,
        description: newForm.description,
        maxMarks: Number(newForm.maxMarks) || 50,
        dueDate: newForm.dueDate || undefined,
      });
      toast.success('Assignment created');
      setShowCreate(false);
      setNewForm({ ...newForm, title: '', description: '' });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create');
    }
  };

  const openSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    const list = await assignmentService.getAssignmentSubmissions(assignment.id);
    setSubmissions(list || []);
    const draft = {};
    for (const s of list || []) {
      draft[s.id] = { marks: s.marks ?? '', remarks: s.remarks || '' };
    }
    setGradeInputs(draft);
  };

  const saveGrade = async (subId) => {
    const val = gradeInputs[subId];
    if (!val || val.marks === '') {
      toast.error('Enter marks first');
      return;
    }
    try {
      await assignmentService.gradeSubmission(subId, {
        marks: Number(val.marks),
        remarks: val.remarks,
      });
      toast.success('Submission graded');
      openSubmissions(selectedAssignment);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Grading failed');
    }
  };

  const downloadFile = async (sub) => {
    const res = await assignmentService.fetchSubmissionFileBlob(sub.id);
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = sub.originalFileName || 'submission';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  if (loading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Assignments &amp; Grading
          </h2>
          <p className="text-xs text-slate-500">Create tasks &amp; grade submissions</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-1 rounded-2xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createAssignment}
          className="rounded-3xl border border-blue-100 bg-white p-4 shadow-xs space-y-2.5"
        >
          <select
            value={newForm.classId}
            onChange={(e) => setNewForm({ ...newForm, classId: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Assignment title"
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            rows={2}
            placeholder="Instructions"
            value={newForm.description}
            onChange={(e) =>
              setNewForm({ ...newForm, description: e.target.value })
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={1}
              value={newForm.maxMarks}
              onChange={(e) =>
                setNewForm({ ...newForm, maxMarks: e.target.value })
              }
              placeholder="Max marks"
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
            <input
              type="datetime-local"
              value={newForm.dueDate}
              onChange={(e) => setNewForm({ ...newForm, dueDate: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white"
          >
            Publish Assignment
          </button>
        </form>
      )}

      <div className="space-y-3">
        {assignments.map((a) => (
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
                <p className="text-[11px] text-slate-500">
                  Due: {formatColomboDateTime(a.dueDate)} • Max {a.maxMarks}
                </p>
              </div>
              <StatusBadge
                label={`${a.submissionCount || 0} sub`}
                tone={a.pendingGradeCount > 0 ? 'amber' : 'green'}
              />
            </div>
            <button
              type="button"
              onClick={() => openSubmissions(a)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-slate-900 py-2.5 text-xs font-bold text-white"
            >
              <ClipboardCheck className="h-4 w-4" />
              Review Submissions ({a.pendingGradeCount || 0} pending)
            </button>
          </div>
        ))}
      </div>

      {selectedAssignment && (
        <div className="rounded-3xl border border-blue-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {selectedAssignment.title}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedAssignment(null)}
              className="text-xs font-bold text-slate-500"
            >
              Close
            </button>
          </div>
          {submissions.length === 0 ? (
            <p className="text-xs text-slate-500">No submissions yet.</p>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="rounded-2xl bg-slate-50 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{s.studentName}</span>
                  <StatusBadge
                    label={s.status}
                    tone={s.status === 'graded' ? 'green' : s.isLate ? 'amber' : 'blue'}
                  />
                </div>
                {s.answerText && (
                  <p className="rounded-xl bg-white p-2 text-slate-700">
                    {s.answerText}
                  </p>
                )}
                {s.fileUrl && (
                  <button
                    type="button"
                    onClick={() => downloadFile(s)}
                    className="inline-flex items-center gap-1 font-bold text-blue-600"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {s.originalFileName || 'Download Attachment'}
                  </button>
                )}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={selectedAssignment.maxMarks}
                    placeholder={`/${selectedAssignment.maxMarks}`}
                    value={gradeInputs[s.id]?.marks ?? ''}
                    onChange={(e) =>
                      setGradeInputs({
                        ...gradeInputs,
                        [s.id]: {
                          ...gradeInputs[s.id],
                          marks: e.target.value,
                        },
                      })
                    }
                    className="w-20 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold"
                  />
                  <input
                    placeholder="Feedback remarks"
                    value={gradeInputs[s.id]?.remarks ?? ''}
                    onChange={(e) =>
                      setGradeInputs({
                        ...gradeInputs,
                        [s.id]: {
                          ...gradeInputs[s.id],
                          remarks: e.target.value,
                        },
                      })
                    }
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => saveGrade(s.id)}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

