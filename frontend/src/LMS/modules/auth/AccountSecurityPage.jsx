import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import {
  Lock,
  LogOut,
  User,
  Phone,
  School,
  Save,
  CheckCircle2,
  ShieldCheck,
  Camera,
  X,
} from 'lucide-react';
import { messageService } from '../../services/messageService';
import apiClient from '../../services/apiClient';
import { useLMSAuth } from '../../context/LMSAuthContext';
import InstallLMSButton from '../../pwa/InstallLMSButton';
import UserAvatar from '../../components/user/UserAvatar';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

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

  // Cropper & Photo upload state
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP)');
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setShowCropper(true);
    if (e.target) e.target.value = '';
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!previewUrl || !croppedAreaPixels) return;
    setSavingPhoto(true);
    const toastId = toast.loading('Cropping and saving profile picture...');
    try {
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
      const fileToUpload = new File([croppedBlob], selectedFile?.name || 'profile.jpg', {
        type: 'image/jpeg',
      });
      const formData = new FormData();
      formData.append('profilePicture', fileToUpload);
      await apiClient.post('/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (refreshMe) await refreshMe();
      toast.success('Profile picture updated successfully!', { id: toastId });
      setShowCropper(false);
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile picture', { id: toastId });
    } finally {
      setSavingPhoto(false);
    }
  };

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
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <UserAvatar user={user} size="xl" ringColor="ring-white/40 shadow-lg" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={savingPhoto}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md ring-2 ring-slate-900 hover:bg-indigo-500 active:scale-95 transition cursor-pointer disabled:opacity-50"
              title="Change & crop profile photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
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

      {/* Image Crop Modal */}
      {showCropper && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Crop Profile Photo</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCropper(false);
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cropper Box */}
            <div className="relative h-60 w-full bg-slate-900 rounded-2xl overflow-hidden shadow-inner">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom Slider */}
            <div className="space-y-1.5 px-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Zoom Level</span>
                <span className="font-mono text-indigo-600">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCropSave}
                disabled={savingPhoto}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-indigo-500/20 active:scale-95 transition cursor-pointer disabled:opacity-60 text-center"
              >
                {savingPhoto ? 'Saving...' : 'Crop & Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCropper(false);
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
