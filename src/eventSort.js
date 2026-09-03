/**
 * Events table sorting
 * Pure comparators for sorting cashflow events by period, frequency, or
 * value. Returns new arrays — the caller reassigns the events ref in one
 * go so row indexes (used for inline editing and removal) stay consistent.
 */

import { FREQUENCIES } from './cashflow.js';

/**
 * @typedef {'startDate'|'frequency'|'value'} EventSortKey
 */

/**
 * @typedef {'asc'|'desc'} EventSortDirection
 */

/**
 * @typedef {Object} EventSort
 * @property {EventSortKey} key
 * @property {EventSortDirection} direction
 */

/**
 * An event as stored by the SPA: ISO date strings, empty endDate when
 * open-ended. Mirrors the engine's Event type with dates as strings —
 * the jsdoc parser used for API.md cannot resolve cross-file typedefs.
 * @typedef {Object} SortableEvent
 * @property {string} name
 * @property {string} startDate - YYYY-MM-DD
 * @property {string} endDate - YYYY-MM-DD, or '' when open-ended
 * @property {string} frequency - daily|weekly|monthly|quarterly|semi-annual|annual
 * @property {number} value - positive for income, negative for expense
 */

/** Chronological rank of each frequency, shortest recurrence first. */
const FREQUENCY_RANK = {
  [FREQUENCIES.DAILY]: 0,
  [FREQUENCIES.WEEKLY]: 1,
  [FREQUENCIES.MONTHLY]: 2,
  [FREQUENCIES.QUARTERLY]: 3,
  [FREQUENCIES.SEMI_ANNUAL]: 4,
  [FREQUENCIES.ANNUAL]: 5,
};

/** Open-ended events (no endDate) sort after bounded ones in ascending order. */
const OPEN_ENDED = '9999-12-31';

/**
 * Sortable composite of an event's period: startDate first, then endDate
 * (open-ended treated as far future). ISO dates compare lexicographically.
 * @param {SortableEvent} event
 * @returns {string}
 */
function periodValue(event) {
  const start = typeof event.startDate === 'string' ? event.startDate : '';
  const end =
    typeof event.endDate === 'string' && event.endDate !== '' ? event.endDate : OPEN_ENDED;
  return `${start}~${end}`;
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function compareStrings(a, b) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

/**
 * @param {SortableEvent} event
 * @returns {number}
 */
function frequencyRank(event) {
  const rank = FREQUENCY_RANK[event.frequency];
  return rank === undefined ? Number.MAX_SAFE_INTEGER : rank;
}

/**
 * Compare two events by the requested sort key only — secondary tie-breaks
 * are applied by sortEvents so they never flip with the direction.
 * @param {SortableEvent} a
 * @param {SortableEvent} b
 * @param {EventSortKey} key
 * @returns {number}
 */
function compareByKey(a, b, key) {
  if (key === 'frequency') {
    return frequencyRank(a) - frequencyRank(b);
  }
  if (key === 'value') {
    return (Number(a.value) || 0) - (Number(b.value) || 0);
  }
  return compareStrings(periodValue(a), periodValue(b));
}

/**
 * Sort events by key and direction without mutating the input.
 * Equal keys keep their original relative order (stable), and secondary
 * tie-breaks (period, then original index) stay ascending regardless of
 * direction so groups of equal rows always appear in a consistent order.
 * @param {SortableEvent[]} events
 * @param {EventSortKey} key
 * @param {EventSortDirection} direction
 * @returns {SortableEvent[]}
 */
export function sortEvents(events, key, direction) {
  const factor = direction === 'desc' ? -1 : 1;
  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const primary = compareByKey(a.event, b.event, key);
      if (primary !== 0) {
        return factor * primary;
      }
      const period = compareStrings(periodValue(a.event), periodValue(b.event));
      return period !== 0 ? period : a.index - b.index;
    })
    .map(entry => entry.event);
}

/**
 * Cycle the sort state when a column header is clicked:
 * unsorted → ascending → descending → unsorted. Clicking a different
 * column always starts ascending.
 * @param {EventSort|null} current
 * @param {EventSortKey} key
 * @returns {EventSort|null}
 */
export function nextEventSort(current, key) {
  if (!current || current.key !== key) {
    return { key, direction: 'asc' };
  }
  if (current.direction === 'asc') {
    return { key, direction: 'desc' };
  }
  return null;
}
