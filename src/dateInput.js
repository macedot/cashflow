/**
 * Date input normalization for user- and CSV-provided date strings.
 * Dependency-free so it can be used by the SPA and tests alike.
 *
 * Strategy (per product decision): auto-fix recognizable formats into
 * strict ISO YYYY-MM-DD; anything ambiguous or unparseable returns null
 * so the caller can warn the user and reject the input.
 */

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const LOOSE_ISO_RE = /^\d{4}-\d{1,2}-\d{1,2}$/;
const SLASH_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const DOTTED_RE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/**
 * Check whether y/m/d form a real calendar date (rejects e.g. 2025-02-30).
 * @param {number} year - Full year
 * @param {number} month - 1-indexed month
 * @param {number} day - Day of month
 * @returns {boolean}
 */
function isRealDate(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/**
 * Format y/m/d as a zero-padded ISO date string.
 * @param {number} year - Full year
 * @param {number} month - 1-indexed month
 * @param {number} day - Day of month
 * @returns {string}
 */
function toISO(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Normalize strict ("2025-03-31") or loose ("2025-3-1") ISO input.
 * @param {string} value - Trimmed, non-empty input string
 * @returns {string|null}
 */
function normalizeIso(value) {
  if (!ISO_RE.test(value) && !LOOSE_ISO_RE.test(value)) {
    return null;
  }
  const [y, m, d] = value.split('-').map(Number);
  return isRealDate(y, m, d) ? toISO(y, m, d) : null;
}

/**
 * Normalize "D/M/YYYY" or "M/D/YYYY". Only unambiguous inputs (exactly one
 * of the first two components > 12) are auto-fixed; ambiguous or impossible
 * combinations return null.
 * @param {RegExpExecArray} match - SLASH_RE match: [full, a, b, year]
 * @returns {string|null}
 */
function normalizeSlash(match) {
  const a = Number(match[1]);
  const b = Number(match[2]);
  const y = Number(match[3]);
  if (a > 12 && b <= 12) {
    return isRealDate(y, b, a) ? toISO(y, b, a) : null; // D/M/YYYY
  }
  if (b > 12 && a <= 12) {
    return isRealDate(y, a, b) ? toISO(y, a, b) : null; // M/D/YYYY
  }
  return null; // ambiguous (both ≤ 12) or invalid (both > 12)
}

/**
 * Normalize European dotted "D.M.YYYY" (day-first convention).
 * @param {RegExpExecArray} match - DOTTED_RE match: [full, day, month, year]
 * @returns {string|null}
 */
function normalizeDotted(match) {
  const d = Number(match[1]);
  const m = Number(match[2]);
  const y = Number(match[3]);
  return isRealDate(y, m, d) ? toISO(y, m, d) : null;
}

/**
 * Normalize a free-form date string into strict ISO YYYY-MM-DD.
 *
 * Accepted inputs:
 * - "YYYY-MM-DD" (returned zero-padded as-is when it is a real calendar date)
 * - "YYYY-M-D" (zero-padded)
 * - "D/M/YYYY" or "M/D/YYYY" — only when unambiguous (exactly one of the
 *   first two components is > 12); ambiguous cases return null
 * - "D.M.YYYY" (European dotted convention, day-first)
 * - Date instances (formatted by their UTC components)
 *
 * @param {string|Date|null|undefined} input - Raw date value
 * @returns {string|null} ISO "YYYY-MM-DD" string, or null when the input
 *   is empty, ambiguous, or not a real calendar date
 */
export function normalizeDateInput(input) {
  if (input instanceof Date) {
    return isNaN(input.getTime())
      ? null
      : toISO(input.getUTCFullYear(), input.getUTCMonth() + 1, input.getUTCDate());
  }
  if (typeof input !== 'string') {
    return null;
  }
  const value = input.trim();
  if (value === '') {
    return null;
  }
  const iso = normalizeIso(value);
  if (iso !== null) {
    return iso;
  }
  const slash = SLASH_RE.exec(value);
  if (slash) {
    return normalizeSlash(slash);
  }
  const dotted = DOTTED_RE.exec(value);
  if (dotted) {
    return normalizeDotted(dotted);
  }
  return null;
}
