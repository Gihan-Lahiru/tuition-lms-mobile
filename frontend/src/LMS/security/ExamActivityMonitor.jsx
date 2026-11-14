import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

/**
 * Honest visibility/focus telemetry during a timed quiz attempt.
 * As required by the blueprint, PWAs do NOT claim screenshot blocking.
 */
export default function ExamActivityMonitor({ onTabSwitch }) {
  const [switchCount, setSwitchCount] = useState(0);

  useEffect(() => {
    const onVisChange = () => {
      if (document.visibilityState === 'hidden') {
        setSwitchCount((prev) => {
          const next = prev + 1;
          if (onTabSwitch) onTabSwitch(next);
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, [onTabSwitch]);

  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-[11px] text-slate-600">
      <div className="flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5 text-slate-500" />
        <span>Focus activity recorded for teacher review</span>
      </div>
      <span className="font-semibold text-slate-800">
        Switches: {switchCount}
      </span>
    </div>
  );
}

