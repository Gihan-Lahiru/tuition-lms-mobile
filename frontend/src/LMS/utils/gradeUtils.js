export const DEFAULT_GRADE_BANDS = [
  { letter: 'A', min: 75, color: 'bg-emerald-100 text-emerald-700' },
  { letter: 'B', min: 65, color: 'bg-blue-100 text-blue-700' },
  { letter: 'C', min: 50, color: 'bg-indigo-100 text-indigo-700' },
  { letter: 'S', min: 35, color: 'bg-amber-100 text-amber-700' },
  { letter: 'F', min: 0, color: 'bg-rose-100 text-rose-700' },
];

export function computePercentage(marks, maxMarks = 100) {
  if (marks === null || marks === undefined || maxMarks <= 0) return null;
  const clamped = Math.max(0, Math.min(Number(marks), Number(maxMarks)));
  return Number(((clamped / Number(maxMarks)) * 100).toFixed(1));
}

export function getGradeBadge(percentage) {
  if (percentage === null || percentage === undefined) {
    return { letter: '—', color: 'bg-slate-100 text-slate-600' };
  }
  for (const band of DEFAULT_GRADE_BANDS) {
    if (percentage >= band.min) return band;
  }
  return DEFAULT_GRADE_BANDS[DEFAULT_GRADE_BANDS.length - 1];
}

export function computeAttendancePercentage(
  records = [],
  countExcusedInDenominator = true,
) {
  const present = records.filter((r) => r.status === 'present').length;
  const late = records.filter((r) => r.status === 'late').length;
  const excused = records.filter((r) => r.status === 'excused').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const total = records.length;
  const denominator = countExcusedInDenominator ? total : Math.max(0, total - excused);
  const numerator = present + late;
  const percentage =
    denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;

  return {
    present,
    late,
    excused,
    absent,
    total,
    numerator,
    denominator,
    percentage,
  };
}

