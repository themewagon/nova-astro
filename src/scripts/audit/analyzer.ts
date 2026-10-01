/**
 * Content analyzer - detecting placeholders, language problems, Polish characters.
 */

import type { PageData, SiteWideIssues } from './types.js';

// === PLACEHOLDERY ===

const PLACEHOLDER_PATTERNS: { pattern: RegExp; label: string }[] = [
  // Latin placeholders
  { pattern: /\blorem\s+ipsum\b/gi, label: 'Lorem ipsum' },
  { pattern: /\bdolor\s+sit\s+amet\b/gi, label: 'Dolor sit amet' },
  { pattern: /\bconsectetur\s+adipiscing\b/gi, label: 'Consectetur adipiscing' },
  // Polskie placeholder'y
  { pattern: /\b[tT]reść\s+do\s+uzupełnienia\b/g, label: 'Treść do uzupełnienia' },
  { pattern: /\b[tT]ekst\s+przykładowy\b/g, label: 'Tekst przykładowy' },
  { pattern: /\b[tT]ekst\s+tymczasowy\b/g, label: 'Tekst tymczasowy' },
  { pattern: /\b[tT]reść\s+tymczasowa\b/g, label: 'Treść tymczasowa' },
  { pattern: /\b[tT]utaj\s+wpisz\b/g, label: 'Tutaj wpisz...' },
  { pattern: /\bwpisz\s+tutaj\b/gi, label: 'Wpisz tutaj' },
  { pattern: /\bwpisz\s+treść\b/gi, label: 'Wpisz treść' },
  { pattern: /\bwpisz\s+tekst\b/gi, label: 'Wpisz tekst' },
  { pattern: /\btekst\s+przykład\b/gi, label: 'Tekst przykład' },
  // Eng placeholder'y
  { pattern: /\bplaceholder\b/gi, label: 'placeholder' },
  { pattern: /\bsample\s+text\b/gi, label: 'Sample text' },
  { pattern: /\bdummy\s+text\b/gi, label: 'Dummy text' },
  { pattern: /\binsert\s+text\b/gi, label: 'Insert text' },
  { pattern: /\btype\s+here\b/gi, label: 'Type here' },
  { pattern: /\bclick\s+here\b/gi, label: 'Click here' },
  { pattern: /\bread\s+more\b/gi, label: 'Read more (sprawdź kontekst)' },
  // TODO/FIXME
  { pattern: /\bTODO\b/g, label: 'TODO' },
  { pattern: /\bFIXME\b/g, label: 'FIXME' },
  { pattern: /\bXXX\b/g, label: 'XXX' },
  // Testowe dane
  { pattern: /\btest@test\.com\b/gi, label: 'E-mail testowy (test@test.com)' },
  { pattern: /\b123456789\b/g, label: 'Numer testowy (123456789)' },
  { pattern: /\bprzykładowa\s+123\b/gi, label: 'Adres testowy' },
];

/**
 * Detects placeholders in the text.
 * Returns a list of unique labels of found placeholders.
 */
export function detectPlaceholders(text: string): string[] {
  const found = new Set<string>();
  for (const { pattern, label } of PLACEHOLDER_PATTERNS) {
    if (pattern.test(text)) {
      found.add(label);
    }
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
  }
  return [...found];
}

// === POLSKIE ZNAKI ===

/**
 * Words that should have Polish diacritical marks.
 * Key = unsigned form, value = correct form.
 */
const POLISH_WORDS: Record<string, string> = {
  'dzialalnosc': 'działalność',
  'dzialalnosci': 'działalności',
  'funkcjonalnosc': 'funkcjonalność',
  'funkcjonalnosci': 'funkcjonalności',
  'jakosc': 'jakość',
  'jakosci': 'jakości',
  'wygoda': 'wygoda', // OK, but there may be "conveniences", etc
  'profesjonalizm': 'profesjonalizm', // OK
  'o nas': 'o nas', // OK
  'kontakt': 'kontakt', // OK
  'strona': 'strona', // OK
  'strony': 'strony', // OK
  'projekt': 'projekt', // OK
  'projekty': 'projekty', // OK
  'klient': 'klient', // OK
  'klienci': 'klienci', // OK
  'usluga': 'usługa',
  'uslugi': 'usługi',
  'realizacje': 'realizacje', // OK
  'swietna': 'świetna',
  'swietny': 'świetny',
  'nowoczesna': 'nowoczesna', // OK
  'nowoczesny': 'nowoczesny', // OK
  'twoja': 'twoja', // OK
  'twoje': 'twoje', // OK
  'wysoka': 'wysoka', // OK
  'wysoki': 'wysoki', // OK
  'najwazniejsze': 'najważniejsze',
  'najwazniejszy': 'najważniejszy',
  'podstawowe': 'podstawowe', // OK
  'firma': 'firma', // OK
  'firmy': 'firmy', // OK
};

/**
 * Checks whether a word without Polish characters appears in the text,
 * but it does not appear in the form with Polish characters.
 */
export function detectMissingDiacritics(text: string): string[] {
  const issues: string[] = [];
  const lowerText = text.toLowerCase();

  for (const [without, withDiacritics] of Object.entries(POLISH_WORDS)) {
    // Skip words that are the same (do not need to be changed)
    if (without === withDiacritics) continue;

    const regexWithout = new RegExp(`\\b${without}\\b`, 'i');
    const regexWith = new RegExp(`\\b${withDiacritics}\\b`, 'i');

    if (regexWithout.test(lowerText) && !regexWith.test(lowerText)) {
      issues.push(`Brak polskich znaków: "${without}" → "${withDiacritics}"`);
    }
  }

  return issues;
}

// === LANGUAGE ANALYSIS ===

export interface LanguageAnalysis {
  placeholders: string[];
  missingDiacritics: string[];
  repeatedWhitespace: boolean;
  allCaps: string[]; // zdania pisane Caps Lockiem
  shortSentences: number; // very short sentences
}

/**
 * Full linguistic analysis of the website text.
 */
export function analyzeLanguage(text: string): LanguageAnalysis {
  const placeholders = detectPlaceholders(text);
  const missingDiacritics = detectMissingDiacritics(text);
  const repeatedWhitespace = /\s{3,}/.test(text);

  // Detect sentences written in Caps Lock (min 5 words, all capital letters)
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  const allCaps = sentences.filter(s => {
    const words = s.split(/\s+/);
    if (words.length < 3) return false;
    return s === s.toUpperCase() && s !== s.toLowerCase();
  });

  // Very short sentences (1-2 words, not including headings)
  const shortSentences = sentences.filter(s => {
    const words = s.split(/\s+/).filter(w => w.length > 0);
    return words.length <= 2 && words.length > 0;
  }).length;

  return {
    placeholders,
    missingDiacritics,
    repeatedWhitespace,
    allCaps,
    shortSentences,
  };
}

// === ANALIZA SITE-WIDE ===

export function analyzeSiteWide(
  pages: PageData[],
  internalLinks: { from: string; to: string }[]
): SiteWideIssues {
  // Duplicate titles
  const titleMap = new Map<string, string[]>();
  for (const p of pages) {
    if (!p.title) continue;
    const existing = titleMap.get(p.title) || [];
    existing.push(p.path);
    titleMap.set(p.title, existing);
  }
  const duplicateTitles = [...titleMap.entries()]
    .filter(([_, paths]) => paths.length > 1)
    .map(([t, paths]) => `"${t}" (${paths.join(', ')})`);

  // Duplikaty meta descriptions
  const metaMap = new Map<string, string[]>();
  for (const p of pages) {
    if (!p.metaDescription) continue;
    const existing = metaMap.get(p.metaDescription) || [];
    existing.push(p.path);
    metaMap.set(p.metaDescription, existing);
  }
  const duplicateMetaDescriptions = [...metaMap.entries()]
    .filter(([_, paths]) => paths.length > 1)
    .map(([d, paths]) => `"${d.substring(0, 50)}..." (${paths.join(', ')})`);

  // Puste strony
  const emptyPages = pages.filter(p => p.wordCount < 50).map(p => p.path);

  // Uszkodzone linki
  const brokenLinks: SiteWideIssues['brokenLinks'] = [];
  for (const page of pages) {
    for (const link of page.links) {
      const target = pages.find(p => p.path === link);
      if (target && target.status >= 400) {
        brokenLinks.push({ page: page.path, link, status: target.status });
      }
    }
  }

  // Language problems (on all sides)
  const languageIssues: SiteWideIssues['languageIssues'] = [];
  for (const page of pages) {
    const analysis = analyzeLanguage(page.bodyText);
    for (const issue of analysis.missingDiacritics) {
      languageIssues.push({ page: page.path, issue });
    }
  }

  // Placeholdery
  const placeholders: SiteWideIssues['placeholders'] = [];
  for (const page of pages) {
    const analysis = analyzeLanguage(page.bodyText);
    if (analysis.placeholders.length > 0) {
      placeholders.push({ page: page.path, matches: analysis.placeholders });
    }
  }

  // Photos without alt
  const missingAltTexts: SiteWideIssues['missingAltTexts'] = [];
  for (const page of pages) {
    const missing = page.images.filter(img => !img.alt && img.src).map(img => img.src);
    if (missing.length > 0) missingAltTexts.push({ page: page.path, images: missing });
  }

  // Brak H1
  const missingH1 = pages.filter(p => p.h1.length === 0 && p.status === 200).map(p => p.path);

  // Not enough content
  const tooShortContent = pages
    .filter(p => p.wordCount < 150 && p.status === 200)
    .map(p => ({ page: p.path, wordCount: p.wordCount }));

  return {
    duplicateTitles,
    duplicateMetaDescriptions,
    emptyPages,
    brokenLinks,
    languageIssues,
    placeholders,
    missingAltTexts,
    missingH1,
    tooShortContent,
    internalLinks,
  };
}
