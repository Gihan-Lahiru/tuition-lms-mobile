export interface GradeThreshold {
  letter: string;
  minPercentage: number;
}

export const DEFAULT_GRADE_SCALE: GradeThreshold[] = [
  { letter: 'A', minPercentage: 75 },
  { letter: 'B', minPercentage: 65 },
  { letter: 'C', minPercentage: 50 },
  { letter: 'S', minPercentage: 35 },
  { letter: 'F', minPercentage: 0 },
];

/**
 * Normalizes strings like "Grade 6", "6", "grade-06" -> "6" for consistent matching.
 */
export function normalizeGrade(raw?: string | null): string {
  if (!raw) return '';
  const cleaned = String(raw).trim().replace(/^grade[\s\-_]*/i, '').trim();
  const digits = cleaned.match(/\d+/);
  if (digits) return String(parseInt(digits[0], 10));
  return cleaned.toLowerCase();
}

export function calculatePercentage(marks: number, maxMarks: number): number {
  if (!Number.isFinite(marks) || !Number.isFinite(maxMarks) || maxMarks <= 0) {
    return 0;
  }
  const clamped = Math.max(0, Math.min(marks, maxMarks));
  return Number(((clamped / maxMarks) * 100).toFixed(2));
}

export function computeGradeLetter(
  percentage: number,
  scale: GradeThreshold[] = DEFAULT_GRADE_SCALE,
): string {
  const sorted = [...scale].sort((a, b) => b.minPercentage - a.minPercentage);
  for (const band of sorted) {
    if (percentage >= band.minPercentage) {
      return band.letter;
    }
  }
  return 'F';
}

export function computeAttendanceStats(
  records: Array<{ status: string }>,
  options: { countExcusedInDenominator?: boolean } = {},
) {
  const countExcused = options.countExcusedInDenominator ?? true;
  let presentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let absentCount = 0;

  for (const rec of records) {
    switch (rec.status) {
      case 'present':
        presentCount += 1;
        break;
      case 'late':
        lateCount += 1;
        break;
      case 'excused':
        excusedCount += 1;
        break;
      case 'absent':
      default:
        absentCount += 1;
        break;
    }
  }

  const totalSessions = records.length;
  // Numerator: present + late + (excused treated as attended when excluded from penalty? Wait: standard rule:
  // If countExcusedInDenominator=false, excused sessions are excluded from denominator and numerator;
  // If true, attended = present + late, excused does not count as attended unless waived -> keep formula explicit!)
  const denominator = countExcused
    ? totalSessions
    : Math.max(0, totalSessions - excusedCount);
  const numerator = presentCount + lateCount;
  const percentage =
    denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;

  return {
    presentCount,
    lateCount,
    excusedCount,
    absentCount,
    totalSessions,
    numerator,
    denominator,
    percentage,
    formulaDescription: countExcused
      ? '(present + late) / totalSessions'
      : '(present + late) / (totalSessions - excused)',
  };
}

