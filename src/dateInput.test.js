import { describe, it, expect } from 'vitest';
import { normalizeDateInput } from './dateInput.js';

describe('normalizeDateInput', () => {
  describe('ISO passthrough', () => {
    it('accepts strict ISO dates unchanged', () => {
      expect(normalizeDateInput('2025-03-31')).toBe('2025-03-31');
    });

    it('trims surrounding whitespace', () => {
      expect(normalizeDateInput('  2025-03-31  ')).toBe('2025-03-31');
    });

    it('rejects impossible calendar dates', () => {
      expect(normalizeDateInput('2025-02-30')).toBeNull();
      expect(normalizeDateInput('2025-13-01')).toBeNull();
      expect(normalizeDateInput('2025-00-10')).toBeNull();
    });

    it('rejects Feb 29 in non-leap years but accepts leap years', () => {
      expect(normalizeDateInput('2025-02-29')).toBeNull();
      expect(normalizeDateInput('2024-02-29')).toBe('2024-02-29');
    });
  });

  describe('loose ISO auto-fix', () => {
    it('zero-pads non-padded ISO dates', () => {
      expect(normalizeDateInput('2025-3-1')).toBe('2025-03-01');
      expect(normalizeDateInput('2025-12-9')).toBe('2025-12-09');
    });

    it('rejects non-padded ISO with impossible dates', () => {
      expect(normalizeDateInput('2025-2-31')).toBeNull();
    });
  });

  describe('slash formats', () => {
    it('auto-fixes unambiguous D/M/YYYY (day > 12)', () => {
      expect(normalizeDateInput('31/03/2025')).toBe('2025-03-31');
    });

    it('auto-fixes unambiguous M/D/YYYY (month component > 12 as day)', () => {
      expect(normalizeDateInput('03/31/2025')).toBe('2025-03-31');
    });

    it('rejects ambiguous dates where both components are <= 12', () => {
      expect(normalizeDateInput('05/03/2025')).toBeNull();
    });

    it('rejects impossible dates like 32/13', () => {
      expect(normalizeDateInput('32/13/2025')).toBeNull();
      expect(normalizeDateInput('13/32/2025')).toBeNull();
    });

    it('rejects impossible day in unambiguous month position', () => {
      expect(normalizeDateInput('31/02/2025')).toBeNull();
    });
  });

  describe('dotted European format', () => {
    it('parses D.M.YYYY day-first', () => {
      expect(normalizeDateInput('31.3.2025')).toBe('2025-03-31');
      expect(normalizeDateInput('1.1.2026')).toBe('2026-01-01');
    });

    it('rejects impossible dotted dates', () => {
      expect(normalizeDateInput('31.02.2025')).toBeNull();
    });
  });

  describe('rejections', () => {
    it('rejects empty and whitespace-only strings', () => {
      expect(normalizeDateInput('')).toBeNull();
      expect(normalizeDateInput('   ')).toBeNull();
    });

    it('rejects non-string non-Date inputs', () => {
      expect(normalizeDateInput(null)).toBeNull();
      expect(normalizeDateInput(undefined)).toBeNull();
      // @ts-ignore - intentionally testing with invalid types
      expect(normalizeDateInput(42)).toBeNull();
      // @ts-ignore - intentionally testing with invalid types
      expect(normalizeDateInput({})).toBeNull();
    });

    it('rejects free text and wrong shapes', () => {
      expect(normalizeDateInput('March 31, 2025')).toBeNull();
      expect(normalizeDateInput('31-03-2025')).toBeNull();
      expect(normalizeDateInput('2025/03/31')).toBeNull();
      expect(normalizeDateInput('31/03/25')).toBeNull();
    });

    it('rejects Invalid Date objects', () => {
      expect(normalizeDateInput(new Date('not-a-date'))).toBeNull();
    });
  });

  describe('Date object input', () => {
    it('formats UTC-midnight dates by their UTC components', () => {
      const d = new Date(Date.UTC(2025, 2, 31));
      expect(normalizeDateInput(d)).toBe('2025-03-31');
    });
  });
});
