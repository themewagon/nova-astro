import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import header from './navigation/header.json';
import footer from './navigation/footer.json';
import company from './global/company.json';
import seo from './global/seo.json';
import homePage from './pages/index.json';
import { SECTION_REGISTRY } from '@config/section-registry';

describe('Data Integrity & Polish Naming Tests', () => {
  it('header.json should have valid structure and labels', () => {
    expect(header).toHaveProperty('menu');
    expect(Array.isArray(header.menu)).toBe(true);
    header.menu.forEach(item => {
      expect(item).toHaveProperty('label');
      expect(typeof item.label).toBe('string');
      expect(item.label.trim().length).toBeGreaterThan(0);
    });
  });

  it('seo.json should have valid SEO meta data', () => {
    // Why: siteName/siteUrl/contactEmail have been moved to company.json
    // (SSOT danych firmy), SEO zawiera tylko ustawienia SEO.
    expect(seo).toHaveProperty('defaultTitle');
    expect(seo).toHaveProperty('index');
    expect(typeof seo.index).toBe('boolean');
  });

  it('homepage config should declare its primary heading', () => {
    expect(homePage).toHaveProperty('heading');
    expect(typeof homePage.heading).toBe('string');
    expect(homePage.heading.trim().length).toBeGreaterThan(0);
  });

  it('company.json should have valid details', () => {
    expect(company).toHaveProperty('name');
    expect(company).toHaveProperty('city');
    // Ensure city is not a placeholder
    expect(company.city.toLowerCase()).not.toBe('city');
    expect(company.city.trim().length).toBeGreaterThan(0);
  });

  it('anchors and links should follow slug standards', () => {
    const allHrefs = [
      ...header.menu.map(m => m.href),
      header.cta.href,
      ...footer.columns.flatMap(c => c.links.map(l => l.href))
    ];
    
    const polishChars = /[ąćęłńóśźż]/i;

    allHrefs.forEach(href => {
      if (href.startsWith('#')) {
        const slug = href.slice(1);
        // Check for Polish characters (anchors should be slugified/normalized)
        expect(polishChars.test(slug), `Anchor ${href} should not contain Polish special characters`).toBe(false);
        
        // Check for spaces
        expect(slug).not.toContain(' ');
      } else if (href.startsWith('/')) {
        // Internal links should not contain spaces or Polish diacritics
        expect(href).not.toContain(' ');
        expect(polishChars.test(href), `Link ${href} should not contain Polish diacritics`).toBe(false);
      }
    });
  });
});

describe('JSON Data Integrity', () => {
  // Reading JSON directly from disk keeps this test useful for files added
  // after the test module was compiled.
  const readJson = (relative: string) =>
    JSON.parse(fs.readFileSync(path.join(process.cwd(), relative), 'utf8'));

  it('nowe JSON-y mają wymagane klucze', () => {
    const requiredKeys: Record<string, string[]> = {
      // Form: button labels and success message
      'src/data/global/form-messages.json': ['submitLabel', 'submittingLabel', 'successMessage'],
      'src/data/global/cookie-consent.json': ['title', 'acceptLabel'],
      'src/data/global/lightbox.json': ['closeLabel'],
      'src/data/navigation/breadcrumbs.json': ['homeLabel'],
      'src/data/navigation/pagination.json': ['prevLabel'],
      'src/data/sections/newsletter.json': ['errors', 'successMessage'],
      'src/data/sections/calendar.json': ['embedTitle', 'noEmbedMessage'],
    };
    for (const [relative, keys] of Object.entries(requiredKeys)) {
      const fullPath = path.join(process.cwd(), relative);
      expect(fs.existsSync(fullPath), `Brak pliku ${relative}`).toBe(true);
      const data = readJson(relative);
      for (const key of keys) {
        expect(data, `${relative} powinien mieć klucz "${key}"`).toHaveProperty(key);
      }
    }
  });

  it('sekcje z src/data/pages/index.json mają wpisy w SECTION_REGISTRY', () => {
    const page = readJson('src/data/pages/index.json');
    expect(Array.isArray(page.sections)).toBe(true);
    for (const section of page.sections) {
      expect(SECTION_REGISTRY[section.id], `Brak wpisu "${section.id}" w SECTION_REGISTRY`).toBeDefined();
    }
  });
});
