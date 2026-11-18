import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  GraduationCap,
  Megaphone,
  Target,
  TrendingUp,
  Video,
} from 'lucide-react';
import { useLMSAuth } from '../../context/LMSAuthContext';
import { assignmentService } from '../../services/assignmentService';
import { quizService } from '../../services/quizService';
import { resultService } from '../../services/resultService';
import { attendanceService } from '../../services/attendanceService';
import { contentService } from '../../services/contentService';
import AttendanceRing from '../../components/charts/AttendanceRing';
import StatusBadge from '../../components/feedback/StatusBadge';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import InstallLMSButton from '../../pwa/InstallLMSButton';
import UserAvatar from '../../components/user/UserAvatar';
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
  const displayName = user?.name || 'Gihan Lahiru';
  const displayGrade = user?.grade || 'Grade 6';
  const completionRate = data.assignmentSummary?.completionRate ?? 0;

  return (
    <div className="space-y-4 p-4">
      {/* ── 1. Hero Greeting Banner Card (Purple/Indigo Gradient + 3D Illustration) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 p-5 text-white shadow-sm">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              to="/lms/security"
              className="relative shrink-0 rounded-full transition-transform active:scale-95"
              title="View Profile"
            >
              <UserAvatar
                user={user}
                size="lg"
                ring={true}
                ringColor="ring-white/40 shadow-md"
              />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-100">Welcome back,</p>
              <h2 className="mt-0.5 text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5 truncate">
                <span className="truncate">{displayName}</span>
                <span className="text-lg shrink-0">👋</span>
              </h2>
              <p className="mt-0.5 text-xs font-medium text-blue-100 truncate">
                {displayGrade} • Active Learner
              </p>
            </div>
          </div>

          {/* 3D Books & Pen Holder Graphic */}
          <div className="shrink-0 w-28 h-20 relative flex items-center justify-end select-none pointer-events-none">
            <svg viewBox="0 0 140 100" className="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Soft Ambient Glow */}
              <circle cx="85" cy="50" r="45" fill="rgba(255,255,255,0.12)" filter="blur(8px)" />
              {/* Stacked Books */}
              {/* Bottom Book */}
              <rect x="15" y="68" width="85" height="15" rx="4" fill="#ffffff" />
              <rect x="15" y="65" width="85" height="5" rx="2" fill="#3b82f6" />
              {/* Middle Book */}
              <rect x="25" y="52" width="75" height="13" rx="3" fill="#ffffff" />
              <rect x="25" y="49" width="75" height="4" rx="2" fill="#8b5cf6" />
              {/* Top Book (Purple Cover) */}
              <rect x="35" y="38" width="65" height="11" rx="3" fill="#ffffff" />
              <rect x="35" y="35" width="65" height="4" rx="2" fill="#6366f1" />
              {/* Pencil Holder Cup */}
              <rect x="100" y="42" width="30" height="42" rx="6" fill="#1e3a8a" />
              <rect x="103" y="45" width="24" height="36" rx="4" fill="#2563eb" />
              {/* Pencils inside cup */}
              <line x1="108" y1="20" x2="108" y2="45" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
              <line x1="116" y1="12" x2="116" y2="45" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
              <line x1="123" y1="16" x2="123" y2="45" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── 2. Top 3 Metric Summary Cards ── */}
      <div className="grid grid-cols-3 gap-2.5">
        <Link
          to="/lms/quizzes"
          className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 shadow-xs hover:border-blue-200 transition"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold leading-tight text-slate-900">
              {data.quizzes.length}
            </p>
            <p className="text-[11px] font-medium text-slate-500 truncate">Quizzes</p>
          </div>
        </Link>

        <Link
          to="/lms/assignments"
          className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 shadow-xs hover:border-amber-200 transition"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold leading-tight text-slate-900">
              {pendingAssignments.length}
            </p>
            <p className="text-[11px] font-medium text-slate-500 truncate">Due Work</p>
          </div>
        </Link>

        <Link
          to="/lms/results"
          className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 shadow-xs hover:border-emerald-200 transition"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold leading-tight text-slate-900">
              {termAvg !== null && termAvg !== undefined ? `${Math.round(termAvg)}%` : '—'}
            </p>
            <p className="text-[11px] font-medium text-slate-500 truncate">Term Avg</p>
          </div>
        </Link>
      </div>

      {/* ── 3. Attendance + Work Progress (2-Column Grid) ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Attendance Card */}
        <Link
          to="/lms/attendance"
          className="flex flex-col items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-xs hover:border-indigo-200 transition"
        >
          <div className="my-1">
            <AttendanceRing percentage={monthlyPct} size={74} color="#6366f1" />
          </div>
          <div className="mt-1">
            <p className="text-xs font-bold text-slate-900">Attendance</p>
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3 text-indigo-500" />
              <span>
                {data.attendance?.monthlySummary?.numerator ?? 0}/
                {data.attendance?.monthlySummary?.denominator ?? 0} this month
              </span>
            </p>
          </div>
        </Link>

        {/* Work Progress Card */}
        <Link
          to="/lms/assignments"
          className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-xs hover:border-indigo-200 transition"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Target className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Work Progress</p>
                <p className="text-[10px] text-slate-500 truncate">Assignments submitted</p>
              </div>
            </div>

            {/* Horizontal Progress Bar */}
            <div className="mt-4 mb-2">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, completionRate))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-1">
            <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>{completionRate}% complete</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── 4. Quick Action Tiles (5 Pills) ── */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { to: '/lms/videos', label: 'Videos', icon: Video, bg: 'bg-purple-50 text-purple-600' },
          { to: '/lms/study', label: 'Papers', icon: BookOpen, bg: 'bg-blue-50 text-blue-600' },
          { to: '/lms/quizzes', label: 'MCQ Quiz', icon: CheckSquare, bg: 'bg-indigo-50 text-indigo-600' },
          { to: '/lms/results', label: 'Results', icon: Award, bg: 'bg-emerald-50 text-emerald-600' },
          { to: '/lms/fees', label: 'Fees', icon: CreditCard, bg: 'bg-amber-50 text-amber-600' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white py-3 px-1 text-center shadow-xs active:scale-95 transition hover:shadow-sm"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="mt-1.5 text-[11px] font-bold text-slate-800 truncate w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── 5. Active Quizzes Card ── */}
      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Quizzes</h3>
              <p className="text-[11px] text-slate-500">
                {data.quizzes.length > 0
                  ? `${data.quizzes.length} quiz${data.quizzes.length > 1 ? 'zes' : ''} available`
                  : 'No published quizzes right now.'}
              </p>
            </div>
          </div>
          <Link
            to="/lms/quizzes"
            className="flex items-center gap-0.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            <span>View all</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {data.quizzes.length > 0 && (
          <div className="mt-3 space-y-2">
            {data.quizzes.slice(0, 2).map((q) => (
              <Link
                key={q.id}
                to={`/lms/quizzes/${q.id}`}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 hover:bg-indigo-50/50 transition"
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate text-xs font-bold text-slate-900">{q.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
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
          </div>
        )}
      </section>

      {/* ── 6. Upcoming Work Card ── */}
      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Work</h3>
              <p className="text-[11px] text-slate-500">
                {pendingAssignments.length > 0
                  ? `${pendingAssignments.length} assignment${pendingAssignments.length > 1 ? 's' : ''} due`
                  : 'No upcoming assignments.'}
              </p>
            </div>
          </div>
          <Link
            to="/lms/assignments"
            className="flex items-center gap-0.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            <span>See all</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {pendingAssignments.length > 0 && (
          <div className="mt-3 space-y-2">
            {pendingAssignments.slice(0, 2).map((a) => (
              <Link
                key={a.id}
                to="/lms/assignments"
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 hover:bg-blue-50/50 transition"
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate text-xs font-bold text-slate-900">{a.title}</p>
                  <p className="text-[10px] text-slate-500">
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
        )}
      </section>

      {/* ── 7. Class Notices ── */}
      {data.announcements.length > 0 && (
        <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Megaphone className="h-4 w-4 text-indigo-600" />
            <span>Class Notices</span>
          </div>
          <div className="mt-2.5 space-y-2">
            {data.announcements.map((ann) => (
              <div key={ann.id} className="rounded-2xl bg-indigo-50/50 p-3">
                <p className="text-xs font-bold text-slate-900">{ann.title}</p>
                <p className="mt-0.5 text-xs text-slate-600">{ann.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 8. Install LMS App Banner ── */}
      <InstallLMSButton />
    </div>
  );
}

