export default function AttendanceRing({ percentage = 0, size = 84, color }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number(percentage) || 0));
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    color || (clamped >= 75 ? '#10b981' : clamped >= 50 ? '#f59e0b' : '#ef4444');

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-extrabold text-slate-900">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

