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
    <button
      type="button"
      onClick={promptInstall}
      className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-left text-white shadow-sm active:scale-[0.99] transition"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold">Install MW Tuition LMS App</p>
          <p className="text-xs text-blue-100">
            Open full-screen directly from your home screen
          </p>
        </div>
      </div>
      <Download className="h-5 w-5 shrink-0" />
    </button>
  );
}

