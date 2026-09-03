import { describe, it, expect } from 'vitest';
import { runSimulation, FREQUENCIES, isValidDate, parseDate } from './cashflow.js';

/**
 * @param {Date} d
 * @returns {string}
 */
function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * @param {Array<{cashflow: number}>} results
 * @returns {number[]}
 */
function getCashflows(results) {
  return results.map(r => r.cashflow);
}

describe('runSimulation', () => {
  describe('basic functionality', () => {
    it('returns one entry per calendar day (continuous)', () => {
      const r = runSimulation([], 1000, '2025-01-01', '2025-01-03');
      expect(r.length).toBe(3);
      expect(fmt(r[0].date)).toBe('2025-01-01');
      expect(fmt(r[1].date)).toBe('2025-01-02');
      expect(fmt(r[2].date)).toBe('2025-01-03');
    });

    it('day 0 has initial balance, no events', () => {
      const r = runSimulation([], 500, '2025-01-01', '2025-01-01');
      expect(r.length).toBe(1);
      expect(r[0].balance).toBe(500);
      expect(r[0].cashflow).toBe(0);
      expect(r[0].items).toEqual([]);
    });

    it('empty events returns all days with initial balance', () => {
      const r = runSimulation([], 1000, '2025-01-01', '2025-01-03');
      expect(r.every(entry => entry.cashflow === 0 && entry.balance === 1000)).toBe(true);
    });
  });

  describe('monthly frequency', () => {
    it('fires on startDate every month', () => {
      const r = runSimulation(
        [
          {
            name: 'Salary',
            startDate: '2025-01-01',
            endDate: '2025-03-01',
            frequency: 'monthly',
            value: 5000,
          },
        ],
        1000,
        '2025-01-01',
        '2025-03-31'
      );
      expect(r.filter(e => e.cashflow !== 0).length).toBe(3);
      expect(getCashflows(r.filter(e => e.cashflow !== 0))).toEqual([5000, 5000, 5000]);
    });

    it('balance carries forward on days without events', () => {
      const r = runSimulation(
        [
          {
            name: 'Salary',
            startDate: '2025-01-01',
            endDate: '2025-01-01',
            frequency: 'monthly',
            value: 1000,
          },
        ],
        500,
        '2025-01-01',
        '2025-01-05'
      );
      // Jan1: +1000 = 1500, Jan2-5: 0, balance stays 1500
      expect(r[0].balance).toBe(1500);
      expect(r[1].balance).toBe(1500);
      expect(r[4].balance).toBe(1500);
    });

    it('month overflow: Jan 31 + 1 month = Feb 28', () => {
      const r = runSimulation(
        [
          {
            name: 'E',
            startDate: '2025-01-31',
            endDate: '2025-02-28',
            frequency: 'monthly',
            value: 100,
          },
        ],
        0,
        '2025-01-31',
        '2025-02-28'
      );
      // Only 2 events: Jan31 and Feb28
      const eventDays = r.filter(e => e.cashflow !== 0);
      expect(eventDays.length).toBe(2);
      expect(fmt(eventDays[0].date)).toBe('2025-01-31');
      expect(fmt(eventDays[1].date)).toBe('2025-02-28');
    });

    it('month overflow: Jan 31 + 1 month in leap year = Feb 29', () => {
      const r = runSimulation(
        [
          {
            name: 'E',
            startDate: '2024-01-31',
            endDate: '2024-02-29',
            frequency: 'monthly',
            value: 100,
          },
        ],
        0,
        '2024-01-31',
        '2024-02-29'
      );
      const eventDays = r.filter(e => e.cashflow !== 0);
      expect(eventDays.length).toBe(2);
      expect(fmt(eventDays[0].date)).toBe('2024-01-31');
      expect(fmt(eventDays[1].date)).toBe('2024-02-29');
    });
  });

  describe('weekly frequency', () => {
    it('fires every 7 days', () => {
      const r = runSimulation(
        [
          {
            name: 'W',
            startDate: '2025-01-01',
            endDate: '2025-01-22',
            frequency: 'weekly',
            value: 100,
          },
        ],
        0,
        '2025-01-01',
        '2025-01-22'
      );
      const eventDays = r.filter(e => e.cashflow !== 0);
      expect(eventDays.length).toBe(4); // Jan1, Jan8, Jan15, Jan22
      expect(fmt(eventDays[0].date)).toBe('2025-01-01');
      expect(fmt(eventDays[1].date)).toBe('2025-01-08');
      expect(fmt(eventDays[2].date)).toBe('2025-01-15');
      expect(fmt(eventDays[3].date)).toBe('2025-01-22');
    });
  });

  describe('daily frequency', () => {
    it('fires every day', () => {
      const r = runSimulation(
        [
          {
            name: 'D',
            startDate: '2025-01-01',
            endDate: '2025-01-03',
            frequency: 'daily',
            value: 10,
          },
        ],
        0,
        '2025-01-01',
        '2025-01-03'
      );
      expect(r.filter(e => e.cashflow !== 0).length).toBe(3);
    });
  });

  describe('quarterly frequency', () => {
    it('fires every 3 months', () => {
      const r = runSimulation(
        [
          {
            name: 'Q',
            startDate: '2025-01-01',
            endDate: '2025-10-01',
            frequency: 'quarterly',
            value: 3000,
          },
        ],
        0,
        '2025-01-01',
        '2025-10-01'
      );
      const eventDays = r.filter(e => e.cashflow !== 0);
      expect(eventDays.length).toBe(4); // Jan1, Apr1, Jul1, Oct1
      expect(fmt(eventDays[0].date)).toBe('2025-01-01');
      expect(fmt(eventDays[1].date)).toBe('2025-04-01');
      expect(fmt(eventDays[2].date)).toBe('2025-07-01');
      expect(fmt(eventDays[3].date)).toBe('2025-10-01');
    });
  });

  describe('semi-annual frequency', () => {
    it('fires every 6 months', () => {
      const r = runSimulation(
        [
          {
            name: 'S',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            frequency: 'semi-annual',
            value: 6000,
          },
        ],
        0,
        '2025-01-01',
        '2025-12-31'
      );
      const eventDays = r.filter(e => e.cashflow !== 0);
      expect(eventDays.length).toBe(2); // Jan1, Jul1
      expect(fmt(eventDays[0].date)).toBe('2025-01-01');
      expect(fmt(eventDays[1].date)).toBe('2025-07-01');
    });
  });

  describe('annual frequency', () => {
    it('fires once per year', () => {
      const r = runSimulation(
        [
          {
            name: 'A',
            startDate: '2025-01-01',
            endDate: '2027-01-01',
            frequency: 'annual',
            value: 12000,
          },
        ],
        0,
        '2025-01-01',
        '2027-12-31'
      );
      const eventDays = r.filter(e => e.cashflow !== 0);
      expect(eventDays.length).toBe(3);
      expect(fmt(eventDays[0].date)).toBe('2025-01-01');
      expect(fmt(eventDays[1].date)).toBe('2026-01-01');
      expect(fmt(eventDays[2].date)).toBe('2027-01-01');
    });

    it('Feb 29 in leap year → Feb 28 in non-leap year', () => {
      const r = runSimulation(
        [
          {
            name: 'A',
            startDate: '2024-02-29',
            endDate: '2025-02-28',
            frequency: 'annual',
            value: 100,
          },
        ],
        0,
        '2024-02-29',
        '2025-02-28'
      );
      const eventDays = r.filter(e => e.cashflow !== 0);
      expect(eventDays.length).toBe(2);
      expect(fmt(eventDays[0].date)).toBe('2024-02-29');
      expect(fmt(eventDays[1].date)).toBe('2025-02-28'); // 2025 is not leap year
    });

    it('Feb 28 in non-leap year → Feb 28 next year', () => {
      const r = runSimulation(
        [
          {
            name: 'A',
            startDate: '2025-02-28',
            endDate: '2027-02-28',
            frequency: 'annual',
            value: 100,
          },
        ],
        0,
        '2025-02-28',
        '2027-02-28'
      );
      const eventDays = r.filter(e => e.cashflow !== 0);
      expect(eventDays.length).toBe(3);
      expect(fmt(eventDays[0].date)).toBe('2025-02-28');
      expect(fmt(eventDays[1].date)).toBe('2026-02-28');
      expect(fmt(eventDays[2].date)).toBe('2027-02-28');
    });
  });

  describe('multiple events on same day', () => {
    it('cashflows are summed', () => {
      const r = runSimulation(
        [
          {
            name: 'Salary',
            startDate: '2025-01-01',
            endDate: '2025-01-01',
            frequency: 'monthly',
            value: 5000,
          },
          {
            name: 'Bonus',
            startDate: '2025-01-01',
            endDate: '2025-01-01',
            frequency: 'monthly',
            value: 1000,
          },
        ],
        1000,
        '2025-01-01',
        '2025-01-01'
      );
      expect(r.length).toBe(1);
      expect(r[0].cashflow).toBe(6000);
      expect(r[0].balance).toBe(7000);
    });

    it('items array contains all event names', () => {
      const r = runSimulation(
        [
          {
            name: 'Salary',
            startDate: '2025-01-01',
            endDate: '2025-01-01',
            frequency: 'monthly',
            value: 5000,
          },
          {
            name: 'Bonus',
            startDate: '2025-01-01',
            endDate: '2025-01-01',
            frequency: 'monthly',
            value: 1000,
          },
        ],
        0,
        '2025-01-01',
        '2025-01-01'
      );
      expect(r[0].items).toContain('Salary');
      expect(r[0].items).toContain('Bonus');
    });
  });

  describe('date range clipping', () => {
    it('event before simStart is ignored', () => {
      const r = runSimulation(
        [
          {
            name: 'E',
            startDate: '2024-01-01',
            endDate: '2024-06-01',
            frequency: 'monthly',
            value: 100,
          },
        ],
        0,
        '2025-01-01',
        '2025-03-31'
      );
      expect(r.every(e => e.cashflow === 0)).toBe(true);
    });

    it('event after simEnd is ignored', () => {
      const r = runSimulation(
        [
          {
            name: 'E',
            startDate: '2026-01-01',
            endDate: '2026-06-01',
            frequency: 'monthly',
            value: 100,
          },
        ],
        0,
        '2025-01-01',
        '2025-03-31'
      );
      expect(r.every(e => e.cashflow === 0)).toBe(true);
    });

    it('event partially overlapping sim range is clipped', () => {
      const r = runSimulation(
        [
          {
            name: 'E',
            startDate: '2024-01-01',
            endDate: '2025-02-15',
            frequency: 'monthly',
            value: 100,
          },
        ],
        0,
        '2025-01-01',
        '2025-03-31'
      );
      // Only fires Jan1 and Feb1 (before Feb15), next would be Mar1 which is after Feb15 end
      const eventDays = r.filter(e => e.cashflow !== 0);
      expect(eventDays.length).toBe(2);
      expect(fmt(eventDays[0].date)).toBe('2025-01-01');
      expect(fmt(eventDays[1].date)).toBe('2025-02-01');
    });
  });

  describe('zero-value events', () => {
    it('event with value=0 generates no cashflow entries', () => {
      const r = runSimulation(
        [
          {
            name: 'E',
            startDate: '2025-01-01',
            endDate: '2025-03-31',
            frequency: 'monthly',
            value: 0,
          },
        ],
        1000,
        '2025-01-01',
        '2025-03-31'
      );
      // generateEventCashflows would generate occurrences but value=0
      // The runSimulation sums values, so 0-value events produce 0 cashflow
      expect(r.every(e => e.cashflow === 0)).toBe(true);
    });
  });

  describe('expense events', () => {
    it('negative value decreases balance', () => {
      const r = runSimulation(
        [
          {
            name: 'Rent',
            startDate: '2025-01-01',
            endDate: '2025-01-01',
            frequency: 'monthly',
            value: -1500,
          },
        ],
        5000,
        '2025-01-01',
        '2025-01-01'
      );
      expect(r[0].cashflow).toBe(-1500);
      expect(r[0].balance).toBe(3500);
    });

    it('income and expense on same day net correctly', () => {
      const r = runSimulation(
        [
          {
            name: 'Salary',
            startDate: '2025-01-01',
            endDate: '2025-01-01',
            frequency: 'monthly',
            value: 5000,
          },
          {
            name: 'Rent',
            startDate: '2025-01-01',
            endDate: '2025-01-01',
            frequency: 'monthly',
            value: -1500,
          },
        ],
        1000,
        '2025-01-01',
        '2025-01-01'
      );
      expect(r[0].cashflow).toBe(3500);
      expect(r[0].balance).toBe(4500);
    });
  });
});

describe('parseDate', () => {
  it('parses YYYY-MM-DD as local time', () => {
    const d = parseDate('2025-03-15');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(2); // 0-indexed
    expect(d.getDate()).toBe(15);
  });

  it('passes through Date objects', () => {
    const original = new Date(2025, 2, 15);
    const d = parseDate(original);
    expect(d.getTime()).toBe(original.getTime());
  });

  it('returns Invalid Date for garbage input', () => {
    const d = parseDate('not-a-date');
    expect(isValidDate(d)).toBe(false);
  });
});

describe('isValidDate', () => {
  it('returns true for valid Date', () => {
    expect(isValidDate(new Date())).toBe(true);
  });

  it('returns false for Invalid Date', () => {
    expect(isValidDate(new Date('invalid'))).toBe(false);
  });

  it('returns false for non-Date', () => {
    // @ts-ignore - intentionally testing with non-Date values
    expect(isValidDate('2025-01-01')).toBe(false);
    // @ts-ignore - intentionally testing with non-Date values
    expect(isValidDate(null)).toBe(false);
    // @ts-ignore - intentionally testing with non-Date values
    expect(isValidDate(undefined)).toBe(false);
  });
});

describe('frequency validation', () => {
  it('unknown frequency throws descriptive error', () => {
    expect(() =>
      runSimulation(
        [
          {
            name: 'E',
            startDate: '2025-01-01',
            endDate: '2025-01-01',
            frequency: 'biweekly',
            value: 100,
          },
        ],
        0,
        '2025-01-01',
        '2025-01-01'
      )
    ).toThrow(/biweekly/);
  });
});

describe('FREQUENCIES', () => {
  it('contains all expected values', () => {
    expect(FREQUENCIES.DAILY).toBe('daily');
    expect(FREQUENCIES.WEEKLY).toBe('weekly');
    expect(FREQUENCIES.MONTHLY).toBe('monthly');
    expect(FREQUENCIES.QUARTERLY).toBe('quarterly');
    expect(FREQUENCIES.SEMI_ANNUAL).toBe('semi-annual');
    expect(FREQUENCIES.ANNUAL).toBe('annual');
  });
});
