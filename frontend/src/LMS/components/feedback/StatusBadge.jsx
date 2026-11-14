const TONES = {
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-rose-100 text-rose-700',
  slate: 'bg-slate-100 text-slate-700',
  indigo: 'bg-indigo-100 text-indigo-700',
};

export default function StatusBadge({ label, tone = 'slate' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        TONES[tone] || TONES.slate
      }`}
    >
      {label}
    </span>
  );
}

