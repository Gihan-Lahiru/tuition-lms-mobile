import { describe, expect, test } from 'vitest';
import {
  computeAttendancePercentage,
  computePercentage,
  getGradeBadge,
} from '../utils/gradeUtils';
import { formatCountdown } from '../utils/formatters';

describe('LMS Mobile Frontend Utilities', () => {
  test('calculates grade percentage & bands safely', () => {
    expect(computePercentage(82, 100)).toBe(82);
    expect(computePercentage(null, 100)).toBeNull();
    expect(getGradeBadge(78).letter).toBe('A');
    expect(getGradeBadge(65).letter).toBe('B');
    expect(getGradeBadge(52).letter).toBe('C');
    expect(getGradeBadge(40).letter).toBe('S');
    expect(getGradeBadge(20).letter).toBe('F');
  });

  test('computes attendance percentage with explicit excused handling', () => {
    const records = [
      { status: 'present' },
      { status: 'late' },
      { status: 'excused' },
      { status: 'absent' },
    ];
    expect(computeAttendancePercentage(records, true).percentage).toBe(50);
    expect(computeAttendancePercentage(records, false).percentage).toBe(66.7);
  });

  test('formats quiz timer countdown in MM:SS', () => {
    expect(formatCountdown(65)).toBe('01:05');
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(-10)).toBe('00:00');
  });
});

