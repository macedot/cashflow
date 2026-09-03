import { describe, it, expect } from 'vitest';
import { sortEvents, nextEventSort } from './eventSort.js';

/**
 * Helper to build a minimal event
 * @param {string} name
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} frequency
 * @param {number} value
 * @returns {import('./eventSort.js').SortableEvent}
 */
function ev(name, startDate, endDate, frequency, value) {
  return { name, startDate, endDate, frequency, value };
}

describe('sortEvents', () => {
  it('sorts by period (startDate, then endDate) ascending', () => {
    const events = [
      ev('Gym', '2026-01-03', '', 'weekly', -50),
      ev('Rent', '2026-01-01', '2026-12-31', 'monthly', -1200),
      ev('Salary', '2026-01-01', '2026-06-30', 'monthly', 3000),
    ];
    const sorted = sortEvents(events, 'startDate', 'asc');
    expect(sorted.map(e => e.name)).toEqual(['Salary', 'Rent', 'Gym']);
  });

  it('sorts open-ended events after bounded ones with the same startDate', () => {
    const events = [
      ev('Salary', '2026-01-01', '', 'monthly', 3000),
      ev('Loan', '2026-01-01', '2027-12-12', 'monthly', -470),
    ];
    expect(sortEvents(events, 'startDate', 'asc').map(e => e.name)).toEqual(['Loan', 'Salary']);
    expect(sortEvents(events, 'startDate', 'desc').map(e => e.name)).toEqual(['Salary', 'Loan']);
  });

  it('sorts by frequency in shortest-recurrence-first order', () => {
    const events = [
      ev('Annual bonus', '2026-05-01', '', 'annual', 5000),
      ev('Coffee', '2026-02-01', '', 'daily', -4),
      ev('Rent', '2026-01-05', '', 'monthly', -1200),
      ev('Gym', '2026-01-03', '', 'weekly', -50),
      ev('Insurance', '2026-04-01', '', 'semi-annual', -300),
      ev('Vehicle tax', '2026-03-01', '', 'quarterly', -200),
    ];
    const sorted = sortEvents(events, 'frequency', 'asc');
    expect(sorted.map(e => e.name)).toEqual([
      'Coffee',
      'Gym',
      'Rent',
      'Vehicle tax',
      'Insurance',
      'Annual bonus',
    ]);
  });

  it('breaks frequency ties by period, ascending regardless of direction', () => {
    const events = [
      ev('Rent', '2026-01-05', '', 'monthly', -1200),
      ev('Salary', '2026-01-01', '', 'monthly', 3000),
    ];
    expect(sortEvents(events, 'frequency', 'asc').map(e => e.name)).toEqual(['Salary', 'Rent']);
    expect(sortEvents(events, 'frequency', 'desc').map(e => e.name)).toEqual(['Salary', 'Rent']);
  });

  it('sorts by value numerically, negatives before positives ascending', () => {
    const events = [
      ev('Salary', '2026-01-01', '', 'monthly', 3000),
      ev('Coffee', '2026-02-01', '', 'daily', -4),
      ev('Rent', '2026-01-05', '', 'monthly', -1200),
      ev('Refund', '2026-03-01', '', 'weekly', 0),
    ];
    expect(sortEvents(events, 'value', 'asc').map(e => e.name)).toEqual([
      'Rent',
      'Coffee',
      'Refund',
      'Salary',
    ]);
    expect(sortEvents(events, 'value', 'desc').map(e => e.name)).toEqual([
      'Salary',
      'Refund',
      'Coffee',
      'Rent',
    ]);
  });

  it('keeps equal rows in their original order (stable sort)', () => {
    const events = [
      ev('First', '2026-01-01', '', 'monthly', 100),
      ev('Second', '2026-01-01', '', 'monthly', 100),
      ev('Third', '2026-01-01', '', 'monthly', 100),
    ];
    expect(sortEvents(events, 'value', 'asc').map(e => e.name)).toEqual([
      'First',
      'Second',
      'Third',
    ]);
    expect(sortEvents(events, 'value', 'desc').map(e => e.name)).toEqual([
      'First',
      'Second',
      'Third',
    ]);
  });

  it('does not mutate the input array', () => {
    const events = [
      ev('B', '2026-02-01', '', 'monthly', 2),
      ev('A', '2026-01-01', '', 'monthly', 1),
    ];
    const copy = [...events];
    sortEvents(events, 'startDate', 'asc');
    expect(events).toEqual(copy);
  });

  it('returns a new array even when already sorted', () => {
    const events = [ev('A', '2026-01-01', '', 'monthly', 1)];
    const sorted = sortEvents(events, 'value', 'asc');
    expect(sorted).not.toBe(events);
    expect(sorted).toEqual(events);
  });
});

describe('nextEventSort', () => {
  it('starts ascending on an unsorted table', () => {
    expect(nextEventSort(null, 'value')).toEqual({ key: 'value', direction: 'asc' });
  });

  it('cycles asc → desc on the same column', () => {
    expect(nextEventSort({ key: 'value', direction: 'asc' }, 'value')).toEqual({
      key: 'value',
      direction: 'desc',
    });
  });

  it('clears the sort after descending', () => {
    expect(nextEventSort({ key: 'value', direction: 'desc' }, 'value')).toBeNull();
  });

  it('restarts ascending when switching columns', () => {
    expect(nextEventSort({ key: 'value', direction: 'desc' }, 'frequency')).toEqual({
      key: 'frequency',
      direction: 'asc',
    });
  });
});
