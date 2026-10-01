import { describe, it, expect } from 'vitest';
import { formatInternalLink, isExternal } from './url';

describe('URL Utilities', () => {
  describe('formatInternalLink', () => {
    it('should append trailing slash to internal links', () => {
      expect(formatInternalLink('kontakt')).toBe('/kontakt/');
      expect(formatInternalLink('/uslugi')).toBe('/uslugi/');
    });

    it('should not duplicate trailing slash if already exists', () => {
      expect(formatInternalLink('/realizacje/')).toBe('/realizacje/');
    });

    it('should handle home page correctly', () => {
      expect(formatInternalLink('/')).toBe('/');
      expect(formatInternalLink('')).toBe('/');
    });

    it('should preserve anchors with trailing slash on base path', () => {
      expect(formatInternalLink('uslugi#kontakt')).toBe('/uslugi/#kontakt');
      expect(formatInternalLink('/o-nas/#zespol')).toBe('/o-nas/#zespol');
    });

    it('should preserve query parameters', () => {
      expect(formatInternalLink('/szukaj?q=test')).toBe('/szukaj/?q=test');
    });

    it('should ignore external links', () => {
      expect(formatInternalLink('https://google.com')).toBe('https://google.com');
      expect(formatInternalLink('mailto:test@example.com')).toBe('mailto:test@example.com');
      expect(formatInternalLink('tel:+48123456789')).toBe('tel:+48123456789');
    });

    it('should handle standalone anchors', () => {
      expect(formatInternalLink('#sekcja')).toBe('#sekcja');
    });

    it('should fix multiple slashes', () => {
      expect(formatInternalLink('///uslugi//')).toBe('/uslugi/');
    });
  });

  describe('isExternal', () => {
    it('should identify external links correctly', () => {
      expect(isExternal('https://test.pl')).toBe(true);
      expect(isExternal('http://test.pl')).toBe(true);
      expect(isExternal('//test.pl')).toBe(true);
      expect(isExternal('/kontakt')).toBe(false);
      expect(isExternal('#test')).toBe(false);
    });
  });
});
