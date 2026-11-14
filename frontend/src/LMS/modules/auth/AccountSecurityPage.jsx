import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Lock,
  LogOut,
  User,
  Phone,
  School,
  Save,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { messageService } from '../../services/messageService';
import apiClient from '../../services/apiClient';
import { useLMSAuth } from '../../context/LMSAuthContext';
import InstallLMSButton from '../../pwa/InstallLMSButton';

export default function AccountSecurityPage() {
  const { user, logout, refreshMe } = useLMSAuth();

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    institute: user?.institute || '',
    grade: user?.grade || 'Grade 10',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        institute: user.institute || '',
        grade: user.grade || 'Grade 10',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await messageService.updateProfile(profileForm);
      toast.success('Profile details updated!');
      if (refreshMe) await refreshMe();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingPwd(true);
    try {
      await apiClient.post('/auth/change-password', pwdForm);
      toast.success('Password updated successfully');
      setPwdForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update password');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-4 p-4 antialiased">
      {/* Profile Overview Card */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-xl font-black text-white backdrop-blur-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-black tracking-tight text-white">
                {user?.name}
              </h2>
              <span className="rounded-full bg-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-200 capitalize">
                {user?.role}
              </span>
            </div>
            <p className="truncate text-xs text-blue-200/90">{user?.email}</p>
            <p className="mt-1 text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{user?.approvalStatus === 'approved' ? 'Verified Account' : 'Pending Verification'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Details */}
      <form
        onSubmit={handleUpdateProfile}
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <User className="h-4 w-4 text-blue-600" />
          <span>Edit Profile Information</span>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">Full Name</label>
          <input
            required
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-slate-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-semibold text-slate-700">Phone / WhatsApp</label>
            <input
              placeholder="0771234567"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Grade</label>
            <select
              value={profileForm.grade}
              onChange={(e) => setProfileForm({ ...profileForm, grade: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-slate-800"
            >
              {['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">School / Branch</label>
          <input
            placeholder="e.g. Royal College / Colombo Branch"
            value={profileForm.institute}
            onChange={(e) => setProfileForm({ ...profileForm, institute: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-60 transition"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>
      </form>

      {/* Change Password Card */}
      <form
        onSubmit={handleChangePassword}
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Lock className="h-4 w-4 text-indigo-600" />
          <span>Change Password</span>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">Current Password</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={pwdForm.currentPassword}
            onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition text-slate-800"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">New Password (min 6 chars)</label>
          <input
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            value={pwdForm.newPassword}
            onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition text-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={savingPwd}
          className="w-full rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-60 transition"
        >
          {savingPwd ? 'Updating password...' : 'Update Password'}
        </button>
      </form>

      {/* Sign Out Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 py-3 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out from LMS</span>
        </button>
      </div>

      <InstallLMSButton />
    </div>
  );
}
