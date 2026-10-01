import { describe, expect, it } from 'vitest';
import { auditContent, isExcluded, PLACEHOLDER_PATTERNS } from './content-audit';

describe('content audit', () => {
  describe('isExcluded', () => {
    it('excludes qa fixture json', () => {
      expect(isExcluded('src/data/qa/mobile-fixture.json')).toBe(true);
    });

    it('excludes qa fixture page', () => {
      expect(isExcluded('src/pages/qa/mobile-fixture.astro')).toBe(true);
    });

    it('excludes audit baseline', () => {
      expect(isExcluded('.audit-baseline.json')).toBe(true);
    });

    it('does not exclude production data', () => {
      expect(isExcluded('src/data/global/company.json')).toBe(false);
    });
  });

  describe('placeholder patterns exist', () => {
    it('has rules for example email', () => {
      const rule = PLACEHOLDER_PATTERNS.find((p) => p.rule === 'example-email');
      expect(rule).toBeDefined();
      expect(rule!.patterns.some((r) => r.test('kontakt@example.com'))).toBe(true);
    });

    it('has rules for placeholder phone', () => {
      const rule = PLACEHOLDER_PATTERNS.find((p) => p.rule === 'placeholder-phone');
      expect(rule).toBeDefined();
      expect(rule!.patterns.some((r) => r.test('+48 123 456 789'))).toBe(true);
    });

    it('has rules for placeholder address', () => {
      const rule = PLACEHOLDER_PATTERNS.find((p) => p.rule === 'placeholder-address');
      expect(rule).toBeDefined();
      expect(rule!.patterns.some((r) => r.test('ul. Przykładowa 123'))).toBe(true);
      expect(rule!.patterns.some((r) => r.test('ul. Przykladowa 123'))).toBe(true);
    });

    it('has rules for placeholder name', () => {
      const rule = PLACEHOLDER_PATTERNS.find((p) => p.rule === 'placeholder-name');
      expect(rule).toBeDefined();
      expect(rule!.patterns.some((r) => r.test('"Nazwa strony"'))).toBe(true);
    });

    it('has rules for placeholder company', () => {
      const rule = PLACEHOLDER_PATTERNS.find((p) => p.rule === 'placeholder-company');
      expect(rule).toBeDefined();
      expect(rule!.patterns.some((r) => r.test('Twoja Firma'))).toBe(true);
    });

    it('has rules for placeholder tagline', () => {
      const rule = PLACEHOLDER_PATTERNS.find((p) => p.rule === 'placeholder-tagline');
      expect(rule).toBeDefined();
      expect(rule!.patterns.some((r) => r.test('Krótki opis'))).toBe(true);
      expect(rule!.patterns.some((r) => r.test('Krotki opis'))).toBe(true);
    });

    it('has rules for social media href #', () => {
      const rule = PLACEHOLDER_PATTERNS.find((p) => p.rule === 'placeholder-social-href');
      expect(rule).toBeDefined();
      expect(rule!.patterns.some((r) => r.test('"facebook": "#"'))).toBe(true);
      expect(rule!.patterns.some((r) => r.test('"instagram": "#"'))).toBe(true);
      expect(rule!.patterns.some((r) => r.test('"twitter": "#"'))).toBe(true);
    });

    it('has rules for twitter handle @', () => {
      const rule = PLACEHOLDER_PATTERNS.find((p) => p.rule === 'placeholder-twitter-handle');
      expect(rule).toBeDefined();
      expect(rule!.patterns.some((r) => r.test('"twitterHandle": "@"'))).toBe(true);
    });

    it('has rules for placeholder text', () => {
      const rule = PLACEHOLDER_PATTERNS.find((p) => p.rule === 'placeholder-text');
      expect(rule).toBeDefined();
      expect(rule!.patterns.some((r) => r.test(': "To jest placeholder tekst"'))).toBe(true);
    });
  });

  describe('auditContent detects placeholders', () => {
    it('detects kontakt@example.com', () => {
      const source = JSON.stringify({ email: 'kontakt@example.com' });
      const issues = auditContent(source, 'src/data/global/company.json');
      expect(issues.some((i) => i.rule === 'example-email')).toBe(true);
    });

    it('detects +48 123 456 789', () => {
      const source = JSON.stringify({ phone: '+48 123 456 789' });
      const issues = auditContent(source, 'src/data/global/company.json');
      expect(issues.some((i) => i.rule === 'placeholder-phone')).toBe(true);
    });

    it('detects ul. Przykładowa', () => {
      const source = JSON.stringify({ address: 'ul. Przykładowa 123' });
      const issues = auditContent(source, 'src/data/global/company.json');
      expect(issues.some((i) => i.rule === 'placeholder-address')).toBe(true);
    });

    it('detects Nazwa strony', () => {
      const source = JSON.stringify({ name: 'Nazwa strony' });
      const issues = auditContent(source, 'src/config/template.ts');
      expect(issues.some((i) => i.rule === 'placeholder-name')).toBe(true);
    });

    it('detects Twoja Firma', () => {
      const source = JSON.stringify({ name: 'Twoja Firma' });
      const issues = auditContent(source, 'src/data/global/company.json');
      expect(issues.some((i) => i.rule === 'placeholder-company')).toBe(true);
    });

    it('detects social href #', () => {
      const source = JSON.stringify({ facebook: '#' });
      const issues = auditContent(source, 'src/config/template.ts');
      expect(issues.some((i) => i.rule === 'placeholder-social-href')).toBe(true);
    });

    it('detects twitterHandle @', () => {
      const source = JSON.stringify({ twitterHandle: '@' });
      const issues = auditContent(source, 'src/config/template.ts');
      expect(issues.some((i) => i.rule === 'placeholder-twitter-handle')).toBe(true);
    });

    it('detects placeholder text in sections', () => {
      const source = '{\n  "title": "To jest placeholder dla testu"\n}';
      const issues = auditContent(source, 'src/data/sections/test.json');
      expect(issues.some((i) => i.rule === 'placeholder-text')).toBe(true);
    });
  });

  describe('does not block qa fixture', () => {
    it('returns no issues for qa fixture json', () => {
      const source = JSON.stringify({ email: 'kontakt@example.com' });
      const issues = auditContent(source, 'src/data/qa/mobile-fixture.json');
      expect(issues).toHaveLength(0);
    });

    it('returns no issues for qa fixture page', () => {
      const source = '<p>kontakt@example.com</p>';
      const issues = auditContent(source, 'src/pages/qa/mobile-fixture.astro');
      expect(issues).toHaveLength(0);
    });

    it('returns no issues for baseline', () => {
      const source = JSON.stringify({ email: 'kontakt@example.com' });
      const issues = auditContent(source, '.audit-baseline.json');
      expect(issues).toHaveLength(0);
    });
  });

  describe('correct line numbers', () => {
    it('reports correct line for placeholder', () => {
      const source = '{\n  "name": "Nazwa strony"\n}';
      const issues = auditContent(source, 'src/config/template.ts');
      const issue = issues.find((i) => i.rule === 'placeholder-name');
      expect(issue).toBeDefined();
      expect(issue!.line).toBe(2);
    });

    it('reports correct line for phone', () => {
      const source = '{\n  "phone": "+48 123 456 789"\n}';
      const issues = auditContent(source, 'src/data/global/company.json');
      const issue = issues.find((i) => i.rule === 'placeholder-phone');
      expect(issue).toBeDefined();
      expect(issue!.line).toBe(2);
    });

    it('reports multiple issues from one file', () => {
      const source = JSON.stringify({
        name: 'Nazwa strony',
        email: 'kontakt@example.com',
        phone: '+48 123 456 789',
      }, null, 2);
      const issues = auditContent(source, 'src/config/template.ts');
      const rules = new Set(issues.map((i) => i.rule));
      expect(rules.has('placeholder-name')).toBe(true);
      expect(rules.has('example-email')).toBe(true);
      expect(rules.has('placeholder-phone')).toBe(true);
    });
  });

  describe('accepts realistic data', () => {
    it('accepts realistic company data', () => {
      const source = JSON.stringify({
        name: 'WebScale Sp. z o.o.',
        email: 'biuro@webscale.pl',
        phone: '+48 601 234 567',
        address: 'ul. Marszałkowska 100',
      }, null, 2);
      const issues = auditContent(source, 'src/data/global/company.json');
      expect(issues).toHaveLength(0);
    });

    it('accepts realistic seo data', () => {
      const source = JSON.stringify({
        siteName: 'WebScale',
        defaultTitle: 'WebScale — Nowoczesne strony internetowe',
        twitterHandle: '@webscale_pl',
      }, null, 2);
      const issues = auditContent(source, 'src/data/global/seo.json');
      expect(issues).toHaveLength(0);
    });

    it('accepts realistic social links', () => {
      const source = JSON.stringify({
        socials: {
          facebook: 'https://facebook.com/webscale',
          twitter: 'https://twitter.com/webscale',
        },
      }, null, 2);
      const issues = auditContent(source, 'src/data/global/company.json');
      expect(issues).toHaveLength(0);
    });

    it('rejects Polish text written without diacritics', () => {
      const source = JSON.stringify({
        title: 'Profesjonalne uslugi dla Twojej firmy',
        cta: 'Wyslij wiadomosc i sprawdz oferte',
      }, null, 2);
      const issues = auditContent(source, 'src/data/sections/contact.json');

      expect(issues.some((issue) => issue.rule === 'polish-diacritics')).toBe(true);
    });

    it('accepts Polish text when its diacritics are present', () => {
      const source = JSON.stringify({
        title: 'Profesjonalne usługi dla Twojej firmy',
        cta: 'Wyślij wiadomość i sprawdź ofertę',
      }, null, 2);
      const issues = auditContent(source, 'src/data/sections/contact.json');

      expect(issues.some((issue) => issue.rule === 'polish-diacritics')).toBe(false);
    });

    it('does not reject English content without Polish diacritics', () => {
      const source = JSON.stringify({
        title: 'Professional digital services for your business',
        cta: 'Send a message and check the offer',
      }, null, 2);
      const issues = auditContent(source, 'src/data/sections/contact.json');

      expect(issues.some((issue) => issue.rule === 'polish-diacritics')).toBe(false);
    });
  });
});
