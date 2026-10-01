import { describe, it, expect } from 'vitest';
import { normalizeCta, normalizeText, normalizeArray } from './normalization';

describe('Normalization Utilities', () => {
  describe('normalizeCta', () => {
    it('should provide defaults for empty input', () => {
      const result = normalizeCta(null);
      expect(result.label).toBe('Dowiedz się więcej');
      expect(result.href).toBe('#');
      expect(result.variant).toBe('primary');
    });

    it('should use provided values', () => {
      const raw = { label: 'Kontakt', href: '/kontakt', variant: 'outline' };
      const result = normalizeCta(raw);
      expect(result.label).toBe('Kontakt');
      expect(result.href).toBe('/kontakt');
      expect(result.variant).toBe('outline');
    });

    it('should handle partial data', () => {
      const raw = { label: 'Tylko Etykieta' };
      const result = normalizeCta(raw);
      expect(result.label).toBe('Tylko Etykieta');
      expect(result.href).toBe('#');
    });
  });

  describe('normalizeText', () => {
    it('should trim whitespace', () => {
      expect(normalizeText('  tekst  ')).toBe('tekst');
    });

    it('should return fallback for non-strings', () => {
      expect(normalizeText(null, 'brak')).toBe('brak');
      expect(normalizeText(undefined, 'brak')).toBe('brak');
      expect(normalizeText(123, 'brak')).toBe('brak');
    });
  });

  describe('normalizeArray', () => {
    it('should return empty array for non-array input', () => {
      expect(normalizeArray(null)).toEqual([]);
    });

    it('should filter out null/undefined', () => {
      expect(normalizeArray([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
    });
  });
});
