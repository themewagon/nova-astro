import { describe, expect, it } from 'vitest';
import { auditLinks, extractLinks, buildRouteMap, isExternal, isSpecial, isAnchorOnly } from './link-audit';
import type { RouteMap } from './link-audit';

const defaultRoutes: RouteMap = buildRouteMap();

describe('link audit', () => {
  describe('isExternal', () => {
    it('detects http URLs', () => {
      expect(isExternal('https://webscale.pl')).toBe(true);
    });
    it('detects protocol-relative URLs', () => {
      expect(isExternal('//fonts.googleapis.com')).toBe(true);
    });
    it('returns false for internal links', () => {
      expect(isExternal('/kontakt/')).toBe(false);
    });
  });

  describe('isSpecial', () => {
    it('detects mailto', () => {
      expect(isSpecial('mailto:biuro@example.com')).toBe(true);
    });
    it('detects tel', () => {
      expect(isSpecial('tel:+48123456789')).toBe(true);
    });
    it('detects javascript', () => {
      expect(isSpecial('javascript:void(0)')).toBe(true);
    });
    it('returns false for normal links', () => {
      expect(isSpecial('/kontakt/')).toBe(false);
    });
  });

  describe('isAnchorOnly', () => {
    it('detects named anchors', () => {
      expect(isAnchorOnly('#contact')).toBe(true);
    });
    it('detects anchor with slashes', () => {
      expect(isAnchorOnly('#section-2')).toBe(true);
    });
    it('returns false for href="#"', () => {
      expect(isAnchorOnly('#')).toBe(false);
    });
  });

  describe('extractLinks', () => {
    it('finds href in anchor tags', () => {
      const source = '<a href="/kontakt/">Kontakt</a>';
      const links = extractLinks(source);
      expect(links).toHaveLength(1);
      expect(links[0].href).toBe('/kontakt/');
    });

    it('finds multiple href values', () => {
      const source = '<a href="/">Start</a><a href="/o-nas/">O nas</a>';
      const links = extractLinks(source);
      expect(links).toHaveLength(2);
    });

    it('returns correct line numbers', () => {
      const source = '<div>\n  <a href="/kontakt/">Kontakt</a>\n</div>';
      const links = extractLinks(source);
      expect(links[0].line).toBe(2);
    });

    it('finds href in JSON values', () => {
      const source = '{"href": "/o-nas/"}';
      const links = extractLinks(source);
      expect(links).toHaveLength(1);
      expect(links[0].href).toBe('/o-nas/');
    });

    it('does not treat Astro props containing href as HTML links', () => {
      const source = 'const promoCtaHref = "";\n<Button href={promoCtaHref} />';
      expect(extractLinks(source)).toHaveLength(0);
    });
  });

  describe('auditLinks', () => {
    it('reports missing trailing slash', () => {
      const source = '<a href="/kontakt">Kontakt</a>';
      const issues = auditLinks(source, 'src/components/test.astro', defaultRoutes);
      expect(issues.some((i) => i.rule === 'trailing-slash')).toBe(true);
    });

    it('accepts trailing slash', () => {
      const source = '<a href="/kontakt/">Kontakt</a>';
      const issues = auditLinks(source, 'src/components/test.astro', defaultRoutes);
      expect(issues.some((i) => i.rule === 'trailing-slash')).toBe(false);
    });

    it('accepts home page root', () => {
      const source = '<a href="/">Start</a>';
      const issues = auditLinks(source, 'src/components/test.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'trailing-slash')).toHaveLength(0);
    });

    it('reports empty href', () => {
      const source = '<a href="#">Link</a>';
      const issues = auditLinks(source, 'src/components/test.astro', defaultRoutes);
      expect(issues.some((i) => i.rule === 'empty-href')).toBe(true);
    });

    it('reports href="" as empty', () => {
      const source = '<a href="">Link</a>';
      const issues = auditLinks(source, 'src/components/test.astro', defaultRoutes);
      expect(issues.some((i) => i.rule === 'empty-href')).toBe(true);
    });

    it('does not report external links', () => {
      const source = '<a href="https://webscale.pl">WebScale</a>';
      const issues = auditLinks(source, 'src/components/test.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'trailing-slash' || i.rule === 'broken-route')).toHaveLength(0);
    });

    it('does not report mailto links', () => {
      const source = '<a href="mailto:biuro@example.com">Email</a>';
      const issues = auditLinks(source, 'src/components/test.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule !== 'empty-href')).toHaveLength(0);
    });

    it('does not report tel links', () => {
      const source = '<a href="tel:+48123456789">Phone</a>';
      const issues = auditLinks(source, 'src/components/test.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule !== 'empty-href')).toHaveLength(0);
    });

    it('does not report named anchors', () => {
      const source = '<a href="#contact">Kontakt</a>';
      const issues = auditLinks(source, 'src/components/test.astro', defaultRoutes);
      expect(issues.length).toBe(0);
    });

    it('reports broken routes', () => {
      const source = '<a href="/nieistniejaca-strona/">Link</a>';
      const issues = auditLinks(source, 'src/components/test.astro', defaultRoutes);
      expect(issues.some((i) => i.rule === 'broken-route')).toBe(true);
    });

    it('does not treat section fixture routes as broken project routes', () => {
      const source = '{"href":"/przyszla-strona/"}';
      const issues = auditLinks(source, 'src/data/sections/demo.json', defaultRoutes);
      expect(issues.some((i) => i.rule === 'broken-route')).toBe(false);
    });

    it('reports multiple issues from one file', () => {
      const source = '<a href="/kontakt">Bez slash</a><a href="#">Pusty</a>';
      const issues = auditLinks(source, 'src/components/test.astro', defaultRoutes);
      const rules = new Set(issues.map((i) => i.rule));
      expect(rules.has('trailing-slash')).toBe(true);
      expect(rules.has('empty-href')).toBe(true);
    });

    it('reports correct line numbers', () => {
      const source = '<div>\n  <a href="/kontakt">CTA</a>\n</div>';
      const issues = auditLinks(source, 'src/components/test.astro', defaultRoutes);
      const issue = issues.find((i) => i.rule === 'trailing-slash');
      expect(issue).toBeDefined();
      expect(issue!.line).toBe(2);
    });
  });

  describe('valid routes', () => {
    it('accepts a current legal route', () => {
      const source = '<a href="/cookies/">Cookies</a>';
      const issues = auditLinks(source, 'src/test.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'broken-route')).toHaveLength(0);
    });

    it('accepts the Polish legal route', () => {
      const source = '<a href="/pl/polityka-prywatnosci/">Privacy</a>';
      const issues = auditLinks(source, 'src/test.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'broken-route')).toHaveLength(0);
    });

    it('accepts the Polish homepage route', () => {
      const source = '<a href="/pl/">Polish homepage</a>';
      const issues = auditLinks(source, 'src/test.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'broken-route')).toHaveLength(0);
    });

    it('rejects /nieznana/', () => {
      const source = '<a href="/nieznana/">Nope</a>';
      const issues = auditLinks(source, 'src/test.astro', defaultRoutes);
      expect(issues.some((i) => i.rule === 'broken-route')).toBe(true);
    });
  });

  describe('h1 heading audit', () => {
    it('reports missing h1', () => {
      const source = '<html><body><p>Brak naglowka</p></body></html>';
      const issues = auditLinks(source, 'src/pages/test.astro', defaultRoutes);
      expect(issues.some((i) => i.rule === 'missing-h1')).toBe(true);
    });

    it('reports multiple h1', () => {
      const source = '<h1>First</h1><h1>Second</h1>';
      const issues = auditLinks(source, 'src/pages/test.astro', defaultRoutes);
      expect(issues.some((i) => i.rule === 'multiple-h1')).toBe(true);
    });

    it('accepts exactly one h1', () => {
      const source = '<html><body><h1>Tylko jeden</h1><p>opis</p></body></html>';
      const issues = auditLinks(source, 'src/pages/test.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'missing-h1' || i.rule === 'multiple-h1')).toHaveLength(0);
    });

    it('detects h1 from Heading component with level=1', () => {
      const source = '<Heading level={1} variant="section-title">Tytul</Heading>';
      const issues = auditLinks(source, 'src/pages/test.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'missing-h1')).toHaveLength(0);
    });

    it('detects h1 from Heading with tag="h1"', () => {
      const source = '<Heading tag="h1">Tytul</Heading>';
      const issues = auditLinks(source, 'src/pages/test.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'missing-h1')).toHaveLength(0);
    });

    it('detects h1 from Heading with variant="hero"', () => {
      const source = '<Heading variant="hero">Tytul</Heading>';
      const issues = auditLinks(source, 'src/pages/test.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'missing-h1')).toHaveLength(0);
    });

    it('detects multiple h1 when both static h1 and Heading level=1', () => {
      const source = '<h1>Static</h1><Heading level={1}>Component</Heading>';
      const issues = auditLinks(source, 'src/pages/test.astro', defaultRoutes);
      expect(issues.some((i) => i.rule === 'multiple-h1')).toBe(true);
    });

    it('skips qa fixture files', () => {
      const source = '<html><body></body></html>';
      const issues = auditLinks(source, 'src/pages/qa/mobile-fixture.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'missing-h1')).toHaveLength(0);
    });

    it('skips development pages', () => {
      const source = '<html><body></body></html>';
      const issues = auditLinks(source, 'src/pages/dev/components.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'missing-h1')).toHaveLength(0);
    });
  });

  describe('form action audit', () => {
    it('reports action="#"', () => {
      const source = '<form action="#">...</form>';
      const issues = auditLinks(source, 'src/pages/contact.astro', defaultRoutes);
      expect(issues.some((i) => i.rule === 'empty-form-action')).toBe(true);
    });

    it('accepts real endpoint', () => {
      const source = '<form action="https://formspree.io/f/xxxxx">...</form>';
      const issues = auditLinks(source, 'src/pages/contact.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'empty-form-action')).toHaveLength(0);
    });

    it('accepts form without action', () => {
      const source = '<form onsubmit="return false;">...</form>';
      const issues = auditLinks(source, 'src/pages/contact.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule === 'empty-form-action')).toHaveLength(0);
    });
  });

  describe('handles section data', () => {
    it('reports href="#" in section CTA', () => {
      const source = '{"primaryCTA": { "href": "#" } }';
      const issues = auditLinks(source, 'src/data/sections/hero-split.json', defaultRoutes);
      expect(issues.some((i) => i.rule === 'empty-href')).toBe(true);
    });
  });

  describe('excludes QA files', () => {
    it('does not audit qa fixture json', () => {
      const source = '<a href="#">test</a>';
      const issues = auditLinks(source, 'src/data/qa/mobile-fixture.json', defaultRoutes);
      expect(issues).toHaveLength(0);
    });

    it('does not audit qa fixture page', () => {
      const source = '<a href="#">test</a>';
      const issues = auditLinks(source, 'src/pages/qa/mobile-fixture.astro', defaultRoutes);
      expect(issues).toHaveLength(0);
    });

    it('does not audit baseline', () => {
      const source = '{"href": "#"}';
      const issues = auditLinks(source, '.audit-baseline.json', defaultRoutes);
      expect(issues).toHaveLength(0);
    });
  });

  describe('accepts valid patterns', () => {
    it('accepts footer with trailing slashes', () => {
      const source = `
        <a href="/">Home</a>
        <a href="/pl/">Polish homepage</a>
        <a href="/cookies/">Cookies</a>
        <a href="/polityka-prywatnosci/">Privacy</a>
        <a href="https://webscale.pl" target="_blank">WebScale</a>
        <a href="mailto:biuro@example.com">Email</a>
        <a href="tel:+48123456789">Phone</a>
      `;
      const issues = auditLinks(source, 'src/components/Footer.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule !== 'empty-href')).toHaveLength(0);
    });

    it('accepts valid navbar links', () => {
      const source = `
        <a href="/">Home</a>
        <a href="/pl/">Polish homepage</a>
        <a href="/cookies/">Cookies</a>
        <a href="/polityka-prywatnosci/">Privacy</a>
      `;
      const issues = auditLinks(source, 'src/components/Navbar.astro', defaultRoutes);
      expect(issues.filter((i) => i.rule !== 'empty-href')).toHaveLength(0);
    });
  });
});
