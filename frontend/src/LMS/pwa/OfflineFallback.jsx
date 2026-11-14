import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineFallback() {
  const isOnline = useNetworkStatus();
  if (isOnline) return null;

  return (
    <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
      <WifiOff className="h-4 w-4 shrink-0 text-amber-700" />
      <span>
        Offline connection detected. Reconnect before submitting answers or downloading papers.
      </span>
    </div>
  );
}

