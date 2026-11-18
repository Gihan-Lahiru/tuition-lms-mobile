import { Navigate, useLocation } from 'react-router-dom';
import { Clock, CreditCard, LogOut } from 'lucide-react';
import { useLMSAuth } from '../context/LMSAuthContext';
import LoadingSkeleton from '../components/feedback/LoadingSkeleton';

export default function RouteGuard({
  children,
  allowedRoles = ['student', 'teacher', 'admin'],
  allowWhenGraceLocked = false,
}) {
  const { user, loading, logout, refreshMe } = useLMSAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (!user) {
    return <Navigate to="/lms/login" state={{ from: location.pathname }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === 'teacher' || user.role === 'admin' ? '/lms/teacher' : '/lms/dashboard'}
        replace
      />
    );
  }

  if (user.role === 'student' && user.approvalStatus !== 'approved') {
    return (
      <div className="p-5">
        <div className="rounded-3xl bg-white p-6 text-center shadow-app">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Clock className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Awaiting Teacher Approval
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Hi {user.name}, your LMS account is currently{' '}
            <span className="font-semibold capitalize">{user.approvalStatus}</span>.
            Once verified by your teacher, all classes, papers, and quizzes unlock.
          </p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={refreshMe}
              className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white"
            >
              Check Again
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'student' && user.isGraceLocked && !allowWhenGraceLocked) {
    return (
      <div className="p-5">
        <div className="rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-app">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <CreditCard className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            14-Day Grace Period Expired
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Monthly class fee verification is overdue. Learning materials, papers, and timed quizzes are locked server-side until your payment receipt is approved.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Navigate to="/lms/fees" replace />
          </div>
        </div>
      </div>
    );
  }

  return children;
}

