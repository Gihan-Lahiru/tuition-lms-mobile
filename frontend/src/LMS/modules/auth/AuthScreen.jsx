import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { useLMSAuth } from '../../context/LMSAuthContext';
import InstallLMSButton from '../../pwa/InstallLMSButton';
import LMSLogo from '../../components/branding/LMSLogo';

export default function AuthScreen() {
  const { login, register } = useLMSAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    grade: 'Grade 10',
    phone: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user =
        mode === 'login'
          ? await login(form.email, form.password, true)
          : await register(form);
      toast.success(`Welcome, ${user.name}!`);
      navigate(
        user.role === 'teacher' || user.role === 'admin'
          ? '/lms/teacher'
          : '/lms/dashboard',
        { replace: true },
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const quickDemoLogin = async (email) => {
    setSubmitting(true);
    try {
      const user = await login(email, 'Demo@1234', true);
      toast.success(`Signed in as ${user.name}`);
      navigate(
        user.role === 'teacher' || user.role === 'admin'
          ? '/lms/teacher'
          : '/lms/dashboard',
        { replace: true },
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200/80 md:py-6 md:px-4 flex items-center justify-center font-sans antialiased">
      <div className="mx-auto min-h-screen md:min-h-0 w-full max-w-[430px] bg-slate-50 md:rounded-[34px] md:border-[6px] md:border-slate-900 overflow-hidden shadow-app animate-fade-in">
        
        {/* Sleek Branded Header */}
        <div className="relative bg-gradient-to-br from-blue-700 via-indigo-600 to-violet-700 px-6 pb-8 pt-9 text-white overflow-hidden">
          {/* Subtle decorative glow circles */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-indigo-400/20 blur-xl" />

          <div className="relative z-10 flex items-center justify-between">
            <LMSLogo size="lg" variant="glass" />
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-amber-300" />
              Mobile App
            </span>
          </div>

          <div className="relative z-10 mt-4">
            <h1 className="text-2xl font-black tracking-tight text-white">
              MW Tuition LMS
            </h1>
            <p className="mt-1 text-xs text-blue-100/90 leading-relaxed">
              Past Papers • Timed Quizzes • Notes • Attendance
            </p>
          </div>
        </div>

        {/* Clean Modern Form Card */}
        <div className="-mt-4 rounded-t-3xl bg-slate-50 px-5 pb-8 pt-5 animate-fade-in-delayed">
          {/* Sign In vs Register Switcher */}
          <div className="grid grid-cols-2 rounded-2xl bg-slate-200/70 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Student Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Full Name
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Kavindu Perera"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Grade
                    </label>
                    <select
                      value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value })}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition font-medium text-slate-700"
                    >
                      {['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'].map(
                        (g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Phone
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="0771234567"
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="student@mwtuition.lk"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
                  aria-label="Toggle password visibility"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 active:scale-[0.99] transition duration-150"
            >
              {submitting
                ? 'Signing in...'
                : mode === 'login'
                  ? 'Sign In to LMS'
                  : 'Create Student Account'}
            </button>
          </form>

          {/* Quick Demo Test Access (Subtle, Clean Cards) */}
          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>One-Tap Demo Login (Password: Demo@1234)</span>
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-1.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => quickDemoLogin('student@mwtuition.lk')}
                className="flex items-center justify-between rounded-xl bg-blue-50/80 px-3 py-2 text-left text-xs font-medium text-blue-950 hover:bg-blue-100 transition"
              >
                <span>Student Portal (Kavindu)</span>
                <span className="rounded-lg bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Student
                </span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => quickDemoLogin('teacher@mwtuition.lk')}
                className="flex items-center justify-between rounded-xl bg-indigo-50/80 px-3 py-2 text-left text-xs font-medium text-indigo-950 hover:bg-indigo-100 transition"
              >
                <span>Teacher Console (Mr. Maleesha)</span>
                <span className="rounded-lg bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Teacher
                </span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => quickDemoLogin('overdue@mwtuition.lk')}
                className="flex items-center justify-between rounded-xl bg-amber-50/80 px-3 py-2 text-left text-xs font-medium text-amber-950 hover:bg-amber-100 transition"
              >
                <span>Payment Grace Lock Demo</span>
                <span className="rounded-lg bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Locked
                </span>
              </button>
            </div>
          </div>

          <div className="mt-4">
            <InstallLMSButton />
          </div>
        </div>

      </div>
    </div>
  );
}
