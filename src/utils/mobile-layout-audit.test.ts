import { describe, expect, it } from 'vitest';
import { auditMobileSource } from '@utils/mobile-layout-audit';

describe('mobile layout audit', () => {
  it('rejects fixed widths that can overflow a phone viewport', () => {
    const issues = auditMobileSource('<div class="w-[480px]"></div>');
    expect(issues.some((issue) => issue.rule === 'fixed-width' && issue.severity === 'error')).toBe(true);
  });

  it('rejects desktop-only layout classes', () => {
    const issues = auditMobileSource('<div class="md:grid md:grid-cols-2"></div>');
    expect(issues.some((issue) => issue.rule === 'mobile-first-layout')).toBe(true);
  });

  it('accepts hidden mobile state and flex sizing utilities', () => {
    const issues = auditMobileSource('<div class="hidden lg:flex lg:flex-1"></div>');
    expect(issues.some((issue) => issue.rule === 'mobile-first-layout')).toBe(false);
  });

  it('ignores markup and links inside source comments', () => {
    const source = '<!-- <img src="/demo.jpg"> <a href="#">Demo</a> -->';
    const issues = auditMobileSource(source);
    expect(issues).toHaveLength(0);
  });

  it('rejects raw semantic markup that bypasses the atomic system', () => {
    const issues = auditMobileSource('<section><h2>Tytul</h2><p>Opis</p></section>');
    expect(issues.filter((issue) => issue.rule === 'atomic-markup')).toHaveLength(3);
  });

  it('rejects internal links without trailing slashes', () => {
    const issues = auditMobileSource('<a href="/kontakt">Kontakt</a>');
    expect(issues.some((issue) => issue.rule === 'internal-link')).toBe(true);
  });

  it('allows intentional exceptions when documented inline', () => {
    const issues = auditMobileSource('<div class="w-[480px] mobile-audit-ignore: third party embed"></div>');
    expect(issues).toHaveLength(0);
  });

  it('accepts the shared mobile layout primitives', () => {
    const source = `
      <div class="grid grid-cols-1 min-w-0 md:grid-cols-3">
        <div class="min-w-0 w-full max-w-full">
          <a href="/kontakt/">Kontakt</a>
        </div>
      </div>
    `;
    expect(auditMobileSource(source)).toHaveLength(0);
  });

  describe('w-screen without constraint', () => {
    it('reports warning for w-screen without overflow-hidden or max-w constraint', () => {
      const issues = auditMobileSource('<div class="w-screen flex"></div>');
      expect(issues.some((issue) => issue.rule === 'full-viewport-width')).toBe(true);
    });

    it('accepts w-screen when combined with overflow-hidden', () => {
      const issues = auditMobileSource('<div class="w-screen overflow-hidden"></div>');
      expect(issues.some((issue) => issue.rule === 'full-viewport-width')).toBe(false);
    });
  });

  describe('inline width', () => {
    it('reports error for inline width > 320px', () => {
      const issues = auditMobileSource('<div style="width: 480px"></div>');
      expect(issues.some((issue) => issue.rule === 'inline-width')).toBe(true);
    });

    it('accepts inline width <= 320px', () => {
      const issues = auditMobileSource('<div style="width: 300px"></div>');
      expect(issues.some((issue) => issue.rule === 'inline-width')).toBe(false);
    });
  });

  describe('whitespace-nowrap', () => {
    it('reports warning for whitespace-nowrap on non-marquee content', () => {
      const issues = auditMobileSource('<span class="whitespace-nowrap font-bold">Dlugi tekst bez zawijania</span>');
      expect(issues.some((issue) => issue.rule === 'no-wrap-text')).toBe(true);
    });

    it('accepts whitespace-nowrap inside marquee context', () => {
      const issues = auditMobileSource('<div class="marquee-track flex gap-8"><span class="whitespace-nowrap">Item</span></div>');
      expect(issues.some((issue) => issue.rule === 'no-wrap-text')).toBe(false);
    });
  });

  describe('missing min-w-0', () => {
    it('reports warning for flex container with text but no min-w-0', () => {
      const issues = auditMobileSource('<div class="flex gap-4"><span>Tekst</span></div>');
      expect(issues.some((issue) => issue.rule === 'missing-min-width')).toBe(true);
    });

    it('accepts flex container with min-w-0', () => {
      const issues = auditMobileSource('<div class="flex min-w-0 gap-4"><span>Tekst</span></div>');
      expect(issues.some((issue) => issue.rule === 'missing-min-width')).toBe(false);
    });
  });

  describe('touch target', () => {
    it('reports warning for small interactive elements', () => {
      const issues = auditMobileSource('<button class="text-sm" type="button">Klik</button>');
      expect(issues.some((issue) => issue.rule === 'touch-target')).toBe(true);
    });
  });

  describe('img attributes', () => {
    it('reports error for img without alt', () => {
      const issues = auditMobileSource('<img src="/test.jpg" />');
      expect(issues.some((issue) => issue.rule === 'missing-alt')).toBe(true);
    });

    it('reports error for img without width', () => {
      const issues = auditMobileSource('<img src="/test.jpg" alt="test" />');
      expect(issues.some((issue) => issue.rule === 'missing-width')).toBe(true);
    });

    it('reports error for img without height', () => {
      const issues = auditMobileSource('<img src="/test.jpg" alt="test" width="100" />');
      expect(issues.some((issue) => issue.rule === 'missing-height')).toBe(true);
    });

    it('accepts img with all required attributes', () => {
      const issues = auditMobileSource('<img src="/test.jpg" alt="test" width="100" height="100" />');
      expect(issues.some((issue) => issue.rule === 'missing-alt' || issue.rule === 'missing-width' || issue.rule === 'missing-height')).toBe(false);
    });
  });

  describe('drawer dialog ARIA', () => {
    it('reports error for dialog without aria-modal', () => {
      const issues = auditMobileSource('<aside role="dialog" aria-label="Menu"></aside>');
      expect(issues.some((issue) => issue.rule === 'drawer-aria-modal')).toBe(true);
    });

    it('reports error for dialog without aria-label', () => {
      const issues = auditMobileSource('<aside role="dialog" aria-modal="true"></aside>');
      expect(issues.some((issue) => issue.rule === 'drawer-aria-label')).toBe(true);
    });

    it('accepts dialog with correct ARIA attributes', () => {
      const issues = auditMobileSource('<aside role="dialog" aria-modal="true" aria-label="Menu nawigacji"></aside>');
      expect(issues.some((issue) => issue.rule.startsWith('drawer-'))).toBe(false);
    });
  });

  describe('navbar toggle ARIA', () => {
    it('reports error for toggle without aria-controls', () => {
      const issues = auditMobileSource('<button type="button" data-navbar-toggle></button>');
      expect(issues.some((issue) => issue.rule === 'drawer-toggle-controls')).toBe(true);
    });

    it('reports warning for toggle without aria-expanded', () => {
      const issues = auditMobileSource('<button type="button" data-navbar-toggle aria-controls="drawer"></button>');
      expect(issues.some((issue) => issue.rule === 'drawer-toggle-expanded')).toBe(true);
    });

    it('accepts toggle with all required attributes', () => {
      const issues = auditMobileSource('<button type="button" data-navbar-toggle aria-controls="site-nav-drawer" aria-expanded="false" aria-label="Menu"></button>');
      expect(issues.some((issue) => issue.rule.startsWith('drawer-toggle'))).toBe(false);
    });
  });

  describe('href="#" detection', () => {
    it('reports error for href="#"', () => {
      const issues = auditMobileSource('<a href="#">Link</a>');
      expect(issues.some((issue) => issue.rule === 'empty-href')).toBe(true);
    });
  });
});
