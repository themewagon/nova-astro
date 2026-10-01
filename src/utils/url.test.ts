import { describe, it, expect } from 'vitest';
import { formatInternalLink, isExternal } from './url';

describe('URL Utilities', () => {
  describe('formatInternalLink', () => {
    it('should append trailing slash to internal links', () => {
      expect(formatInternalLink('kontakt')).toBe('/nova-astro/kontakt/');
      expect(formatInternalLink('/uslugi')).toBe('/nova-astro/uslugi/');
    });

    it('should not duplicate trailing slash if already exists', () => {
      expect(formatInternalLink('/realizacje/')).toBe('/nova-astro/realizacje/');
    });

    it('should handle home page correctly', () => {
      expect(formatInternalLink('/')).toBe('/nova-astro/');
      expect(formatInternalLink('')).toBe('/nova-astro/');
    });

    it('should preserve anchors with trailing slash on base path', () => {
      expect(formatInternalLink('uslugi#kontakt')).toBe('/nova-astro/uslugi/#kontakt');
      expect(formatInternalLink('/o-nas/#zespol')).toBe('/nova-astro/o-nas/#zespol');
    });

    it('should preserve query parameters', () => {
      expect(formatInternalLink('/szukaj?q=test')).toBe('/nova-astro/szukaj/?q=test');
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
      expect(formatInternalLink('///uslugi//')).toBe('/nova-astro/uslugi/');
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
