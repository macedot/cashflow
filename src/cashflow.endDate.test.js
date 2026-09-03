import { describe, it, expect } from 'vitest';
import { runSimulation } from './cashflow.js';

/**
 * @param {Date} d
 * @returns {string}
 */
function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('endDate handling', () => {
  it('respects Date-typed endDate (not just strings)', () => {
    const r = runSimulation(
      [
        {
          name: 'E',
          startDate: '2025-01-01',
          endDate: new Date(Date.UTC(2025, 2, 1)), // 2025-03-01
          frequency: 'monthly',
          value: 100,
        },
      ],
      0,
      '2025-01-01',
      '2025-06-30'
    );
    const eventDays = r.filter(e => e.cashflow !== 0);
    expect(eventDays.map(e => fmt(e.date))).toEqual(['2025-01-01', '2025-02-01', '2025-03-01']);
  });

  it('treats empty/whitespace endDate as no end date', () => {
    const r = runSimulation(
      [{ name: 'E', startDate: '2025-01-01', endDate: '   ', frequency: 'monthly', value: 100 }],
      0,
      '2025-01-01',
      '2025-03-31'
    );
    expect(r.filter(e => e.cashflow !== 0).length).toBe(3);
  });

  it('treats null/undefined endDate as no end date', () => {
    const r = runSimulation(
      // @ts-ignore - testing legacy stored events with null endDate
      [{ name: 'E', startDate: '2025-01-01', endDate: null, frequency: 'monthly', value: 100 }],
      0,
      '2025-01-01',
      '2025-03-31'
    );
    expect(r.filter(e => e.cashflow !== 0).length).toBe(3);
  });

  it('throws on unparseable endDate string instead of running forever', () => {
    expect(() =>
      runSimulation(
        [
          {
            name: 'Rent',
            startDate: '2025-01-01',
            endDate: '31/03/2025',
            frequency: 'monthly',
            value: -100,
          },
        ],
        0,
        '2025-01-01',
        '2025-06-30'
      )
    ).toThrow(/Invalid endDate "31\/03\/2025".*Rent/);
  });

  it('throws on unparseable endDate Date object', () => {
    expect(() =>
      runSimulation(
        [
          {
            name: 'E',
            startDate: '2025-01-01',
            endDate: new Date('not-a-date'),
            frequency: 'monthly',
            value: 100,
          },
        ],
        0,
        '2025-01-01',
        '2025-06-30'
      )
    ).toThrow(/Invalid endDate.*E/);
  });

  it('throws on invalid endDate type', () => {
    expect(() =>
      runSimulation(
        // @ts-ignore - intentionally testing with invalid type
        [{ name: 'E', startDate: '2025-01-01', endDate: 42, frequency: 'monthly', value: 100 }],
        0,
        '2025-01-01',
        '2025-06-30'
      )
    ).toThrow(/Invalid endDate.*expected Date or YYYY-MM-DD string/);
  });

  it('returns no occurrences when endDate is before startDate', () => {
    const r = runSimulation(
      [
        {
          name: 'E',
          startDate: '2025-03-01',
          endDate: '2025-01-01',
          frequency: 'monthly',
          value: 100,
        },
      ],
      0,
      '2025-01-01',
      '2025-06-30'
    );
    expect(r.filter(e => e.cashflow !== 0).length).toBe(0);
  });

  it('throws on unparseable startDate', () => {
    expect(() =>
      runSimulation(
        [{ name: 'E', startDate: '31/01/2025', endDate: '', frequency: 'monthly', value: 100 }],
        0,
        '2025-01-01',
        '2025-06-30'
      )
    ).toThrow(/Invalid startDate.*E/);
  });
});

describe('day-of-month anchoring', () => {
  it('monthly: re-anchors to original day after short month (Jan 31 → Feb 28 → Mar 31)', () => {
    const r = runSimulation(
      [
        {
          name: 'E',
          startDate: '2025-01-31',
          endDate: '2025-03-31',
          frequency: 'monthly',
          value: 100,
        },
      ],
      0,
      '2025-01-01',
      '2025-06-30'
    );
    const eventDays = r.filter(e => e.cashflow !== 0);
    expect(eventDays.map(e => fmt(e.date))).toEqual(['2025-01-31', '2025-02-28', '2025-03-31']);
  });

  it('monthly: anchor works when sim starts after event start', () => {
    const r = runSimulation(
      [
        {
          name: 'E',
          startDate: '2025-01-31',
          endDate: '2025-05-31',
          frequency: 'monthly',
          value: 100,
        },
      ],
      0,
      '2025-03-01',
      '2025-06-30'
    );
    const eventDays = r.filter(e => e.cashflow !== 0);
    expect(eventDays.map(e => fmt(e.date))).toEqual(['2025-03-31', '2025-04-30', '2025-05-31']);
  });

  it('quarterly: re-anchors to original day (Oct 31 → Jan 31 → Apr 30)', () => {
    const r = runSimulation(
      [
        {
          name: 'E',
          startDate: '2025-10-31',
          endDate: '2026-04-30',
          frequency: 'quarterly',
          value: 100,
        },
      ],
      0,
      '2025-10-01',
      '2026-06-30'
    );
    const eventDays = r.filter(e => e.cashflow !== 0);
    expect(eventDays.map(e => fmt(e.date))).toEqual(['2025-10-31', '2026-01-31', '2026-04-30']);
  });

  it('semi-annual: re-anchors to original day (Aug 31 → Feb 28/29 → Aug 31)', () => {
    const r = runSimulation(
      [
        {
          name: 'E',
          startDate: '2024-08-31',
          endDate: '2025-08-31',
          frequency: 'semi-annual',
          value: 100,
        },
      ],
      0,
      '2024-08-01',
      '2025-12-31'
    );
    const eventDays = r.filter(e => e.cashflow !== 0);
    expect(eventDays.map(e => fmt(e.date))).toEqual(['2024-08-31', '2025-02-28', '2025-08-31']);
  });

  it('annual: recovers original Feb 29 in following leap year', () => {
    const r = runSimulation(
      [
        {
          name: 'E',
          startDate: '2024-02-29',
          endDate: '2026-02-28',
          frequency: 'annual',
          value: 100,
        },
      ],
      0,
      '2024-01-01',
      '2026-12-31'
    );
    const eventDays = r.filter(e => e.cashflow !== 0);
    expect(eventDays.map(e => fmt(e.date))).toEqual(['2024-02-29', '2025-02-28', '2026-02-28']);
  });
});
