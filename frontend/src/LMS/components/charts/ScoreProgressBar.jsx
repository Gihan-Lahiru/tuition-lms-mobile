export default function ScoreProgressBar({ value = 0, max = 100, label, tone = 'blue' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const barColors = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    indigo: 'bg-indigo-600',
  };

  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
          <span>{label}</span>
          <span className="font-bold text-slate-900">
            {value}/{max}
          </span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            barColors[tone] || barColors.blue
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

