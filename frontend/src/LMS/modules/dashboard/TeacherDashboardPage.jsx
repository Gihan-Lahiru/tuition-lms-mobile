import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  ClipboardCheck,
  FolderUp,
  CheckSquare,
  Users,
  CalendarCheck,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import { contentService } from '../../services/contentService';
import { quizService } from '../../services/quizService';
import { assignmentService } from '../../services/assignmentService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import StatusBadge from '../../components/feedback/StatusBadge';

export default function TeacherDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    classes: [],
    quizzes: [],
    assignments: [],
    receipts: [],
    students: [],
  });

  const loadAll = async () => {
    try {
      const [classes, quizzes, assignRes, receipts, students] = await Promise.all([
        contentService.getMyClasses(),
        quizService.listQuizzes(),
        assignmentService.getMyAssignments(),
        contentService.listAllReceipts(),
        contentService.listStudents(),
      ]);
      setStats({
        classes,
        quizzes,
        assignments: assignRes.assignments || [],
        receipts,
        students,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleApproveStudent = async (id, approvalStatus) => {
    try {
      await contentService.updateStudentApproval(id, approvalStatus);
      toast.success(`Student marked ${approvalStatus}`);
      loadAll();
    } catch {
      toast.error('Failed to update student approval');
    }
  };

  if (loading) return <LoadingSkeleton rows={4} />;

  const pendingReceipts = stats.receipts.filter((r) => r.approvalStatus === 'pending');
  const pendingStudents = stats.students.filter((s) => s.approvalStatus === 'pending');
  const ungradedCount = stats.assignments.reduce(
    (sum, a) => sum + (a.pendingGradeCount || 0),
    0,
  );

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs font-medium text-indigo-200">Teacher Mobile LMS</p>
        <h2 className="mt-0.5 text-lg font-extrabold">Class &amp; Assessment Hub</h2>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/10 p-2.5">
            <p className="text-lg font-extrabold">{stats.classes.length}</p>
            <p className="text-[11px] text-indigo-100">Classes</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-2.5">
            <p className="text-lg font-extrabold">{ungradedCount}</p>
            <p className="text-[11px] text-indigo-100">To Grade</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-2.5">
            <p className="text-lg font-extrabold">{pendingReceipts.length}</p>
            <p className="text-[11px] text-indigo-100">Slips Pending</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            to: '/lms/teacher/quizzes',
            title: 'MCQ Quizzes',
            desc: `${stats.quizzes.length} active quizzes`,
            icon: CheckSquare,
            tone: 'bg-blue-50 text-blue-700',
          },
          {
            to: '/lms/teacher/assignments',
            title: 'Grade Work',
            desc: `${ungradedCount} submissions waiting`,
            icon: ClipboardCheck,
            tone: 'bg-amber-50 text-amber-700',
          },
          {
            to: '/lms/teacher/marks-attendance',
            title: 'Marks & Roll',
            desc: 'Term scores & attendance',
            icon: CalendarCheck,
            tone: 'bg-emerald-50 text-emerald-700',
          },
          {
            to: '/lms/teacher/content',
            title: 'Study & Fees',
            desc: 'Papers, videos & receipts',
            icon: FolderUp,
            tone: 'bg-indigo-50 text-indigo-700',
          },
          {
            to: '/lms/teacher/messages',
            title: 'Messages',
            desc: 'Student doubts & inquiries',
            icon: MessageSquare,
            tone: 'bg-purple-50 text-purple-700',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.to}
              to={card.to}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs active:scale-[0.98] transition"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">{card.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{card.desc}</p>
            </Link>
          );
        })}
      </div>

      {pendingStudents.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Users className="h-4 w-4 text-amber-700" />
            <span>Pending Student Approvals ({pendingStudents.length})</span>
          </div>
          <div className="mt-3 space-y-2">
            {pendingStudents.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between rounded-2xl bg-white p-3"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{st.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {st.grade} • {st.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleApproveStudent(st.id, 'approved')}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Enrolled Students</h3>
          <StatusBadge label={`${stats.students.length} total`} tone="blue" />
        </div>
        <div className="mt-3 space-y-2">
          {stats.students.slice(0, 5).map((st) => (
            <div
              key={st.id}
              className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5 text-xs"
            >
              <div>
                <p className="font-bold text-slate-900">{st.name}</p>
                <p className="text-[11px] text-slate-500">{st.grade}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusBadge
                  label={st.paymentStatus}
                  tone={st.paymentStatus === 'paid' ? 'green' : 'amber'}
                />
                <StatusBadge
                  label={st.approvalStatus}
                  tone={st.approvalStatus === 'approved' ? 'blue' : 'slate'}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {pendingReceipts.length > 0 && (
        <Link
          to="/lms/teacher/content"
          className="flex items-center justify-between rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-800 border border-rose-200"
        >
          <span className="inline-flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {pendingReceipts.length} fee receipt(s) waiting for review
          </span>
          <span>Review &rarr;</span>
        </Link>
      )}
    </div>
  );
}

