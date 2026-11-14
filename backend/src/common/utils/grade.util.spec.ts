import {
  calculatePercentage,
  computeAttendanceStats,
  computeGradeLetter,
  normalizeGrade,
} from './grade.util';

describe('Grade & Attendance Deterministic Utilities', () => {
  test('normalizes grade strings uniformly', () => {
    expect(normalizeGrade('Grade 10')).toBe('10');
    expect(normalizeGrade('grade-06')).toBe('6');
    expect(normalizeGrade('11')).toBe('11');
    expect(normalizeGrade('')).toBe('');
  });

  test('computes deterministic percentages clamped between 0 and maxMarks', () => {
    expect(calculatePercentage(45, 50)).toBe(90);
    expect(calculatePercentage(-5, 100)).toBe(0);
    expect(calculatePercentage(120, 100)).toBe(100);
    expect(calculatePercentage(10, 0)).toBe(0);
  });

  test('maps percentage to Sri Lankan tuition grade bands', () => {
    expect(computeGradeLetter(75)).toBe('A');
    expect(computeGradeLetter(65)).toBe('B');
    expect(computeGradeLetter(50)).toBe('C');
    expect(computeGradeLetter(35)).toBe('S');
    expect(computeGradeLetter(34.9)).toBe('F');
  });

  test('computes attendance percentage with explicit denominator rules', () => {
    const records = [
      { status: 'present' },
      { status: 'late' },
      { status: 'excused' },
      { status: 'absent' },
    ];
    const standard = computeAttendanceStats(records, {
      countExcusedInDenominator: true,
    });
    expect(standard.numerator).toBe(2);
    expect(standard.denominator).toBe(4);
    expect(standard.percentage).toBe(50);

    const excludingExcused = computeAttendanceStats(records, {
      countExcusedInDenominator: false,
    });
    expect(excludingExcused.numerator).toBe(2);
    expect(excludingExcused.denominator).toBe(3);
    expect(excludingExcused.percentage).toBe(66.7);
  });
});

