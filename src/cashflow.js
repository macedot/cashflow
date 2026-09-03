/**
 * Cashflow Simulation Logic
 * Pure functions for generating cashflow events and calculating balances.
 */

export const FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  SEMI_ANNUAL: 'semi-annual',
  ANNUAL: 'annual',
};

const VALID_FREQUENCIES = new Set(Object.values(FREQUENCIES));

/**
 * Get the next month and year when adding months, handling overflow
 * @param {number} currentMonth - 0-indexed month
 * @param {number} currentYear - Full year
 * @param {number} monthsToAdd - Number of months to add
 * @returns {{year: number, month: number}}
 */
function getNextMonthYear(currentMonth, currentYear, monthsToAdd) {
  const nextMonth = currentMonth + monthsToAdd;
  const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
  const monthNormalized = nextMonth % 12;
  return { year: nextYear, month: monthNormalized };
}

/**
 * Check if a year is a leap year
 * @param {number} year
 * @returns {boolean}
 */
function isLeapYear(year) {
  return new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;
}

/**
 * Add `monthsToAdd` months to y/m, clamping the day to `anchorDay` and the
 * target month's length.
 * @param {number} year - Full year
 * @param {number} month - 0-indexed month
 * @param {number} monthsToAdd - Number of months to add
 * @param {number} anchorDay - Day-of-month anchor for the recurrence
 * @returns {Date}
 */
function addMonthsClamped(year, month, monthsToAdd, anchorDay) {
  const { year: nextYear, month: nextMonth } = getNextMonthYear(month, year, monthsToAdd);
  const daysInNextMonth = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate();
  const nextDay = Math.min(anchorDay, daysInNextMonth);
  return new Date(Date.UTC(nextYear, nextMonth, nextDay));
}

/**
 * @typedef {Object} Event
 * @property {string} name
 * @property {Date|string} startDate
 * @property {Date|string} endDate
 * @property {string} frequency - daily|weekly|monthly|quarterly|semi-annual|annual
 * @property {number} value - positive for income, negative for expense
 */

/**
 * @typedef {Object} CashflowEntry
 * @property {Date} date
 * @property {number} cashflow - total cashflow for this date
 * @property {number} balance - running balance after this date
 * @property {string[]} items - names of events contributing to this cashflow
 */

/**
 * Check if a date is valid (not Invalid Date)
 * @param {Date} d
 * @returns {boolean}
 */
export function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Parse a date string or return as-is if already a Date
 * Uses UTC to avoid timezone shifts when constructing from YYYY-MM-DD.
 * @param {Date|string} dateStr
 * @returns {Date}
 */
export function parseDate(dateStr) {
  if (dateStr instanceof Date) {
    return new Date(dateStr);
  }
  // Handle YYYY-MM-DD format: use UTC to avoid local midnight rollover
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-').map(Number);
    const y = /** @type {number} */ (parts[0]);
    const m = /** @type {number} */ (parts[1]);
    const d = /** @type {number} */ (parts[2]);
    return new Date(Date.UTC(y, m - 1, d));
  }
  return new Date(dateStr);
}

/** Simple period frequencies mapped to their step size in days. */
const SIMPLE_PERIOD_DAYS = {
  [FREQUENCIES.DAILY]: 1,
  [FREQUENCIES.WEEKLY]: 7,
};

/** Month-based frequencies mapped to their step size in months. */
const MONTH_PERIODS = {
  [FREQUENCIES.MONTHLY]: 1,
  [FREQUENCIES.QUARTERLY]: 3,
  [FREQUENCIES.SEMI_ANNUAL]: 6,
};

/**
 * Add one year, clamping Feb 29 to Feb 28 in non-leap years.
 * @param {number} year - Full year
 * @param {number} month - 0-indexed month
 * @param {number} anchorDay - Day-of-month anchor for the recurrence
 * @returns {Date}
 */
function addAnnualClamped(year, month, anchorDay) {
  const nextYear = year + 1;
  const nextDay = anchorDay === 29 && !isLeapYear(nextYear) ? 28 : anchorDay;
  return new Date(Date.UTC(nextYear, month, nextDay));
}

/**
 * Add a time period to a date (using UTC to avoid timezone shifts).
 * For month-based frequencies, the resulting day-of-month is clamped to
 * `anchorDay` (the event's original start day) so occurrences do not
 * permanently drift when a shorter month truncates the day (e.g. Jan 31 →
 * Feb 28 → Mar 31, not Mar 28).
 * @param {Date} date
 * @param {string} frequency
 * @param {number} [anchorDay] - Day-of-month to anchor month-based recurrences to.
 *   Defaults to the day of `date`. Ignored by daily/weekly frequencies.
 * @returns {Date}
 */
function addPeriod(date, frequency, anchorDay) {
  if (!VALID_FREQUENCIES.has(frequency)) {
    throw new Error(
      `Invalid frequency: "${frequency}". Must be one of: ${[...VALID_FREQUENCIES].join(', ')}`
    );
  }

  const simpleDays = SIMPLE_PERIOD_DAYS[frequency];
  if (simpleDays !== undefined) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + simpleDays);
    return d;
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const anchoredDay = typeof anchorDay === 'number' ? anchorDay : date.getUTCDate();

  const monthStep = MONTH_PERIODS[frequency];
  if (monthStep !== undefined) {
    return addMonthsClamped(year, month, monthStep, anchoredDay);
  }
  if (frequency === FREQUENCIES.ANNUAL) {
    return addAnnualClamped(year, month, anchoredDay);
  }
  throw new Error(`Unhandled frequency: ${frequency}`);
}

/**
 * @typedef {Object} CashflowOccurrence
 * @property {Date} date
 * @property {number} value
 * @property {string} name
 */

/**
 * Get the event end date or null if not set.
 * Accepts ISO date strings, Date instances, or empty/whitespace values
 * (treated as "no end date"). Unparseable values throw instead of being
 * silently ignored — an Invalid Date poisons all comparisons and would
 * make the event run forever.
 * @param {Date|string|null|undefined} endDate
 * @param {string} [eventName] - Event name for error messages
 * @returns {Date | null}
 * @throws {Error} When endDate is set but cannot be parsed as a date
 */
function getEventEnd(endDate, eventName) {
  const label = eventName || 'unnamed event';
  if (endDate === null || endDate === undefined || endDate === '') {
    return null;
  }
  if (endDate instanceof Date) {
    if (!isValidDate(endDate)) {
      throw new Error(`Invalid endDate for event "${label}": Date object is not a valid date.`);
    }
    return new Date(endDate);
  }
  if (typeof endDate === 'string') {
    const trimmed = endDate.trim();
    if (trimmed === '') {
      return null;
    }
    const parsed = parseDate(trimmed);
    if (!isValidDate(parsed)) {
      throw new Error(
        `Invalid endDate "${endDate}" for event "${label}": could not be parsed. Use YYYY-MM-DD format.`
      );
    }
    return parsed;
  }
  throw new Error(
    `Invalid endDate for event "${label}": expected Date or YYYY-MM-DD string, got ${typeof endDate}.`
  );
}

/**
 * Get the effective end date for the simulation
 * @param {Date | null} eventEnd
 * @param {Date} simulationEnd
 * @returns {Date}
 */
function getEffectiveEnd(eventEnd, simulationEnd) {
  if (eventEnd !== null && eventEnd < simulationEnd) {
    return eventEnd;
  }
  return simulationEnd;
}

/**
 * Find the first occurrence date on or after a given date
 * @param {Date} startDate
 * @param {Date} targetStart
 * @param {string} frequency
 * @param {number} [anchorDay] - Day-of-month anchor for month-based recurrences
 * @returns {Date}
 */
function findFirstOccurrence(startDate, targetStart, frequency, anchorDay) {
  let currentDate = parseDate(startDate);
  while (currentDate < targetStart) {
    currentDate = addPeriod(currentDate, frequency, anchorDay);
  }
  return currentDate;
}

/**
 * Generate all occurrences of a single event within the simulation range.
 * Returns array of {date, value, name} objects.
 *
 * @param {Event} event
 * @param {Date} simStart
 * @param {Date} simEnd
 * @returns {CashflowOccurrence[]}
 * @throws {Error} When startDate or endDate cannot be parsed
 */
export function generateEventCashflows(event, simStart, simEnd) {
  const startDate = parseDate(event.startDate);
  if (!isValidDate(startDate)) {
    throw new Error(
      `Invalid startDate "${event.startDate}" for event "${event.name || 'unnamed event'}": could not be parsed. Use YYYY-MM-DD format.`
    );
  }
  const eventEnd = getEventEnd(event.endDate, event.name);
  const anchorDay = startDate.getUTCDate();

  // If event ends before simulation starts, return empty
  if (eventEnd !== null && eventEnd < simStart) {
    return [];
  }

  const effectiveEnd = getEffectiveEnd(eventEnd, simEnd);
  const firstOccurrence = findFirstOccurrence(startDate, simStart, event.frequency, anchorDay);

  // If first occurrence is after effective end, return empty
  if (firstOccurrence > effectiveEnd) {
    return [];
  }

  // Generate all occurrences
  /** @type {CashflowOccurrence[]} */
  const result = [];
  let currentDate = new Date(firstOccurrence);

  while (currentDate <= effectiveEnd) {
    result.push({
      date: new Date(currentDate),
      value: event.value,
      name: event.name,
    });
    currentDate = addPeriod(currentDate, event.frequency, anchorDay);
  }

  return result;
}

/**
 * Run a full cashflow simulation.
 * Returns one entry per calendar day from simStart to simEnd (inclusive).
 * Days with no events have cashflow=0 and balance carried forward.
 *
 * @param {Event[]} events - Array of events to simulate
 * @param {number} initialBalance - Starting balance
 * @param {Date|string} simStart - Simulation start date
 * @param {Date|string} simEnd - Simulation end date
 * @returns {CashflowEntry[]}
 * @throws {Error} When any event has an unparseable startDate/endDate, or an invalid frequency
 */
export function runSimulation(events, initialBalance, simStart, simEnd) {
  const start = parseDate(simStart);
  const end = parseDate(simEnd);

  // Collect all cashflow occurrences keyed by date
  const cashflowByDate = new Map();

  for (const event of events) {
    const eventCashflows = generateEventCashflows(event, start, end);
    for (const cf of eventCashflows) {
      const dateKey = `${cf.date.getUTCFullYear()}-${cf.date.getUTCMonth()}-${cf.date.getUTCDate()}`;
      if (!cashflowByDate.has(dateKey)) {
        cashflowByDate.set(dateKey, { date: cf.date, cashflow: 0, items: [] });
      }
      const entry = cashflowByDate.get(dateKey);
      entry.cashflow += cf.value;
      entry.items.push(cf.name);
    }
  }

  // Build continuous daily results from simStart to simEnd
  const results = [];
  let balance = initialBalance;
  const current = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  );
  const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  while (current <= endDay) {
    const dateKey = `${current.getUTCFullYear()}-${current.getUTCMonth()}-${current.getUTCDate()}`;
    const entry = cashflowByDate.get(dateKey);

    if (entry) {
      balance += entry.cashflow;
      results.push({
        date: new Date(current),
        cashflow: entry.cashflow,
        balance,
        items: [...entry.items],
      });
    } else {
      results.push({
        date: new Date(current),
        cashflow: 0,
        balance,
        items: [],
      });
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return results;
}
