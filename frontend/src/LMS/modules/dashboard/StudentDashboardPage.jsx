import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CalendarCheck,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  Megaphone,
  Video,
} from 'lucide-react';
import { useLMSAuth } from '../../context/LMSAuthContext';
import { assignmentService } from '../../services/assignmentService';
import { quizService } from '../../services/quizService';
import { resultService } from '../../services/resultService';
import { attendanceService } from '../../services/attendanceService';
import { contentService } from '../../services/contentService';
import AttendanceRing from '../../components/charts/AttendanceRing';
import ScoreProgressBar from '../../components/charts/ScoreProgressBar';
import StatusBadge from '../../components/feedback/StatusBadge';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import InstallLMSButton from '../../pwa/InstallLMSButton';
import { formatColomboDateTime } from '../../utils/colomboTime';

export default function StudentDashboardPage() {
  const { user } = useLMSAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    assignments: [],
    assignmentSummary: null,
    quizzes: [],
    resultsSummary: null,
    attendance: null,
    announcements: [],
    paymentStatus: null,
  });

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      assignmentService.getMyAssignments(),
      quizService.listQuizzes(),
      resultService.getMyResults(),
      attendanceService.getMyAttendance(),
      contentService.getAnnouncements(),
      contentService.getMyPayments(),
    ]).then(([aRes, qRes, rRes, attRes, annRes, payRes]) => {
      if (!active) return;
      setData({
        assignments: aRes.status === 'fulfilled' ? aRes.value.assignments || [] : [],
        assignmentSummary:
          aRes.status === 'fulfilled' ? aRes.value.summary : null,
        quizzes: qRes.status === 'fulfilled' ? qRes.value || [] : [],
        resultsSummary:
          rRes.status === 'fulfilled' ? rRes.value.summary : null,
        attendance: attRes.status === 'fulfilled' ? attRes.value : null,
        announcements:
          annRes.status === 'fulfilled' ? (annRes.value || []).slice(0, 2) : [],
        paymentStatus:
          payRes.status === 'fulfilled' ? payRes.value.status : null,
      });
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingSkeleton rows={4} />;

  const pendingAssignments = data.assignments.filter((a) => !a.submission);
  const monthlyPct = data.attendance?.monthlySummary?.percentage ?? 0;
  const termAvg = data.resultsSummary?.termAveragePercentage;

  return (
    <div className="space-y-4 p-4">
      {/* Greeting & Quick Fee Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-blue-200">
              {user?.grade || 'Student'} • Active Learner
            </p>
            <h2 className="mt-0.5 text-lg font-extrabold">
              Welcome, {user?.name?.split(' ')[0]}
            </h2>
          </div>
          <Link
            to="/lms/fees"
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              data.paymentStatus?.paymentStatus === 'paid'
                ? 'bg-emerald-500/20 text-emerald-200'
                : 'bg-amber-500/20 text-amber-200'
            }`}
          >
            {data.paymentStatus?.paymentStatus === 'paid'
              ? 'Fee Paid'
              : `${data.paymentStatus?.graceDaysRemaining ?? 0}d Grace`}
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Link
            to="/lms/quizzes"
            className="rounded-2xl bg-white/10 p-2.5 backdrop-blur-xs"
          >
            <p className="text-lg font-extrabold">{data.quizzes.length}</p>
            <p className="text-[11px] text-blue-100">Quizzes</p>
          </Link>
          <Link
            to="/lms/assignments"
            className="rounded-2xl bg-white/10 p-2.5 backdrop-blur-xs"
          >
            <p className="text-lg font-extrabold">{pendingAssignments.length}</p>
            <p className="text-[11px] text-blue-100">Due Work</p>
          </Link>
          <Link
            to="/lms/results"
            className="rounded-2xl bg-white/10 p-2.5 backdrop-blur-xs"
          >
            <p className="text-lg font-extrabold">
              {termAvg !== null && termAvg !== undefined ? `${Math.round(termAvg)}%` : '—'}
            </p>
            <p className="text-[11px] text-blue-100">Term Avg</p>
          </Link>
        </div>
      </div>

      {/* Attendance + Progress Compact Row */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/lms/attendance"
          className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-xs"
        >
          <AttendanceRing percentage={monthlyPct} size={74} />
          <p className="mt-2 text-xs font-bold text-slate-900">Attendance</p>
          <p className="text-[11px] text-slate-500">
            {data.attendance?.monthlySummary?.numerator ?? 0}/
            {data.attendance?.monthlySummary?.denominator ?? 0} this month
          </p>
        </Link>

        <Link
          to="/lms/assignments"
          className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-xs"
        >
          <div>
            <p className="text-xs font-bold text-slate-900">Work Progress</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Assignments submitted
            </p>
          </div>
          <div className="my-2">
            <ScoreProgressBar
              value={data.assignmentSummary?.completed ?? 0}
              max={Math.max(1, data.assignmentSummary?.total ?? 1)}
              tone="emerald"
            />
          </div>
          <p className="text-xs font-bold text-emerald-700">
            {data.assignmentSummary?.completionRate ?? 0}% complete
          </p>
        </Link>
      </div>

      {/* Quick Action App Tiles */}
      <div className="grid grid-cols-5 gap-1.5">
        {[
          { to: '/lms/videos', label: 'Videos', icon: Video, cls: 'bg-purple-50 text-purple-600' },
          { to: '/lms/study', label: 'Papers', icon: BookOpen, cls: 'bg-blue-50 text-blue-600' },
          { to: '/lms/quizzes', label: 'MCQ Quiz', icon: CheckSquare, cls: 'bg-indigo-50 text-indigo-600' },
          { to: '/lms/results', label: 'Results', icon: Award, cls: 'bg-emerald-50 text-emerald-600' },
          { to: '/lms/fees', label: 'Fees', icon: CreditCard, cls: 'bg-amber-50 text-amber-600' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white py-3 px-1 text-center shadow-xs active:scale-95 transition"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.cls}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="mt-1.5 text-[11px] font-bold text-slate-800">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Open Timed Quizzes */}
      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Active Quizzes</h3>
          <Link to="/lms/quizzes" className="text-xs font-semibold text-blue-600">
            View all
          </Link>
        </div>
        <div className="mt-3 space-y-2.5">
          {data.quizzes.slice(0, 2).map((q) => (
            <Link
              key={q.id}
              to={`/lms/quizzes/${q.id}`}
              className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 hover:bg-blue-50/60"
            >
              <div className="min-w-0 pr-2">
                <p className="truncate text-sm font-bold text-slate-900">{q.title}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {q.durationMinutes} min
                  </span>
                  <span>• {q.questionCount} MCQs</span>
                </p>
              </div>
              {q.latestCompletedAttempt ? (
                <StatusBadge
                  label={`${q.latestCompletedAttempt.percentage}%`}
                  tone="green"
                />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              )}
            </Link>
          ))}
          {data.quizzes.length === 0 && (
            <p className="text-xs text-slate-500">No published quizzes right now.</p>
          )}
        </div>
      </section>

      {/* Pending Assignments */}
      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Upcoming Work</h3>
          <Link to="/lms/assignments" className="text-xs font-semibold text-blue-600">
            See all
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {data.assignments.slice(0, 2).map((a) => (
            <Link
              key={a.id}
              to="/lms/assignments"
              className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
            >
              <div className="min-w-0 pr-2">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {a.title}
                </p>
                <p className="text-[11px] text-slate-500">
                  Due: {formatColomboDateTime(a.dueDate)}
                </p>
              </div>
              <StatusBadge
                label={a.effectiveStatus}
                tone={a.effectiveStatus === 'graded' ? 'green' : 'amber'}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Class Notices */}
      {data.announcements.length > 0 && (
        <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Megaphone className="h-4 w-4 text-blue-600" />
            <span>Class Notices</span>
          </div>
          <div className="mt-2.5 space-y-2">
            {data.announcements.map((ann) => (
              <div key={ann.id} className="rounded-2xl bg-blue-50/70 p-3">
                <p className="text-xs font-bold text-slate-900">{ann.title}</p>
                <p className="mt-0.5 text-xs text-slate-600">{ann.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <InstallLMSButton />
    </div>
  );
}

