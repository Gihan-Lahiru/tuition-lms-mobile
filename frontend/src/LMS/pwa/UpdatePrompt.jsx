import { RefreshCw } from 'lucide-react';
import { usePWAInstall } from '../context/PWAInstallContext';

export default function UpdatePrompt() {
  const { hasUpdate, applyUpdate } = usePWAInstall();

  if (!hasUpdate) return null;

  return (
    <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-2xl bg-indigo-950 px-4 py-2.5 text-xs text-white shadow-sm">
      <span>A new LMS update is ready.</span>
      <button
        type="button"
        onClick={applyUpdate}
        className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1 font-semibold text-indigo-950"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Update
      </button>
    </div>
  );
}

