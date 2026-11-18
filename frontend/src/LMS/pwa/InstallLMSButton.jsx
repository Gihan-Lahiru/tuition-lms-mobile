import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../context/PWAInstallContext';

export default function InstallLMSButton({ compact = false }) {
  const { isInstalled, promptInstall } = usePWAInstall();

  if (isInstalled) return null;

  if (compact) {
    return (
      <button
        type="button"
        onClick={promptInstall}
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur hover:bg-white/25 active:scale-95 transition"
        title="Install LMS App"
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span>Install</span>
      </button>
    );
  }

  return (
    <div className="flex w-full items-center justify-between rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 p-4 text-left text-white shadow-sm">
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
          <Smartphone className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">Install MW Tuition LMS App</p>
          <p className="truncate text-[11px] text-blue-100">
            Open full-screen directly from your home screen.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={promptInstall}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-indigo-700 shadow-sm hover:bg-blue-50 active:scale-95 transition cursor-pointer"
        title="Install LMS App"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Install</span>
      </button>
    </div>
  );
}

