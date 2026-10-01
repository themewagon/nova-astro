/**
 * Common types for the party auditor.
 */

export interface PageData {
  url: string;
  path: string;
  status: number;
  title: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  /** Full page text (HTML stripped)*/
  bodyText: string;
  /** Tekst pogrupowany wg sekcji (h2 jako separatory) */
  structuredText: TextSection[];
  wordCount: number;
  links: string[];
  images: { src: string; alt: string }[];
  issues: string[];
  loadTime: number;
}

export interface TextSection {
  heading: string;
  text: string;
  wordCount: number;
}

export interface AuditReport {
  timestamp: string;
  baseUrl: string;
  totalPages: number;
  summary: {
    ok: number;
    warnings: number;
    errors: number;
  };
  pages: PageData[];
  siteWide: SiteWideIssues;
}

export interface SiteWideIssues {
  duplicateTitles: string[];
  duplicateMetaDescriptions: string[];
  emptyPages: string[];
  brokenLinks: { page: string; link: string; status: number }[];
  languageIssues: { page: string; issue: string }[];
  placeholders: { page: string; matches: string[] }[];
  missingAltTexts: { page: string; images: string[] }[];
  missingH1: string[];
  tooShortContent: { page: string; wordCount: number }[];
  internalLinks: { from: string; to: string }[];
}

export interface CrawlerConfig {
  baseUrl: string;
  maxPages: number;
  requestDelay: number;
  skipPatterns: string[];
}
