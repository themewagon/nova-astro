/**
 * Crawler - pobiera strony i wydobywa z nich dane.
 */

import * as cheerio from 'cheerio';
import type { PageData, TextSection, CrawlerConfig } from './types.js';

const DEFAULT_CONFIG: CrawlerConfig = {
  baseUrl: 'http://localhost:4321',
  maxPages: 50,
  requestDelay: 100,
  skipPatterns: ['/dev/', '/qa/', '/studio', '/_astro/', '/.netlify/', '/api/'],
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function normalizePath(url: string, baseUrl: string): string {
  try {
    const parsed = new URL(url, baseUrl);
    let path = parsed.pathname;
    if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
    return path;
  } catch {
    return url;
  }
}

function isInternalLink(href: string, baseUrl: string): boolean {
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  if (href.startsWith('/')) return true;
  try {
    return new URL(href, baseUrl).origin === baseUrl;
  } catch {
    return false;
  }
}

function shouldSkip(path: string, patterns: string[]): boolean {
  return patterns.some(p => path.startsWith(p));
}

/**
 * Extracts text from HTML, grouping it by h2 headings.
 */
function extractStructuredText(html: string): { bodyText: string; structured: TextSection[] } {
  const $ = cheerio.load(html);

  // Remove unstructured items
  $('script, style, nav, footer, header, [aria-hidden="true"], noscript').remove();

  // Full text (line by line)
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

  // Pogrupowany wg h2
  const structured: TextSection[] = [];
  let currentHeading = '(przed pierwszym nagłówkiem)';
  let currentText: string[] = [];

  // Iteruj po direct children body lub sekcjach
  $('body')
    .children()
    .each((_, el) => {
      const $el = $(el);
      const tag = el.tagName?.toLowerCase();

      if (tag === 'h2') {
        // Save the previous section
        if (currentText.length > 0) {
          const text = currentText.join(' ').replace(/\s+/g, ' ').trim();
          if (text.length > 0) {
            structured.push({
              heading: currentHeading,
              text,
              wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
            });
          }
        }
        currentHeading = $el.text().trim() || '(pusty h2)';
        currentText = [];
      } else {
        currentText.push($el.text());
      }
    });

  // Ostatnia sekcja
  if (currentText.length > 0) {
    const text = currentText.join(' ').replace(/\s+/g, ' ').trim();
    if (text.length > 0) {
      structured.push({
        heading: currentHeading,
        text,
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
      });
    }
  }

  return { bodyText, structured };
}

/**
 * Downloads and analyzes one page.
 */
export async function fetchPage(
  path: string,
  config: CrawlerConfig
): Promise<{ status: number; html: string; loadTime: number }> {
  const url = `${config.baseUrl}${path}`;
  const start = Date.now();

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    });
    const html = await response.text();
    return { status: response.status, html, loadTime: Date.now() - start };
  } catch {
    return { status: 0, html: '', loadTime: Date.now() - start };
  }
}

/**
 * Parses the downloaded HTML and returns the full PageData.
 */
export function analyzePage(
  path: string,
  status: number,
  html: string,
  loadTime: number,
  baseUrl: string
): PageData {
  const $ = cheerio.load(html);
  const issues: string[] = [];

  const title = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const h1 = $('h1').map((_, el) => $(el).text().trim()).get();
  const h2 = $('h2').map((_, el) => $(el).text().trim()).get();

  // Linki PRZED wydobyciem tekstu
  const links = $('a[href]')
    .map((_, el) => $(el).attr('href') || '')
    .get()
    .filter(h => isInternalLink(h, baseUrl))
    .map(h => normalizePath(h, baseUrl));

  // Photos
  const images = $('img')
    .map((_, el) => ({
      src: $(el).attr('src') || '',
      alt: $(el).attr('alt') || '',
    }))
    .get();

  // Full + grouped text
  const { bodyText, structured } = extractStructuredText(html);
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

  // --- SPRAWDZENIA ---

  if (status === 404) issues.push('❌ Strona nie znaleziona (404)');
  else if (status === 500) issues.push('❌ Błąd serwera (500)');
  else if (status >= 300 && status < 400) issues.push(`⚠️ Przekierowanie (${status})`);
  else if (status === 0) issues.push('❌ Nie udało się połączyć z serwerem');

  if (!title) issues.push('⚠️ Brak tytułu strony (title)');
  else if (title.length < 10) issues.push(`⚠️ Tytuł za krótki (${title.length} znaków)`);
  else if (title.length > 60) issues.push(`⚠️ Tytuł za długi (${title.length} znaków, max 60)`);

  if (!metaDescription) issues.push('⚠️ Brak meta description');
  else if (metaDescription.length < 50) issues.push(`⚠️ Meta description za krótka (${metaDescription.length} znaków)`);
  else if (metaDescription.length > 160) issues.push(`⚠️ Meta description za długa (${metaDescription.length} znaków)`);

  if (h1.length === 0) issues.push('⚠️ Brak nagłówka H1');
  else if (h1.length > 1) issues.push(`⚠️ Więcej niż jeden H1 (${h1.length})`);

  if (wordCount < 50) issues.push(`⚠️ Bardzo mało tekstu (${wordCount} słów)`);
  else if (wordCount < 150) issues.push(`⚠️ Mało tekstu (${wordCount} słów, zalecane min. 150)`);

  const imagesWithoutAlt = images.filter(img => !img.alt && img.src);
  if (imagesWithoutAlt.length > 0) issues.push(`⚠️ ${imagesWithoutAlt.length} zdjęć bez alt text`);

  if (bodyText.length < 100) issues.push('⚠️ Strona wydaje się pusta lub nie ma treści');

  return {
    url: `${baseUrl}${path}`,
    path,
    status,
    title,
    metaDescription,
    h1,
    h2,
    bodyText,
    structuredText: structured,
    wordCount,
    links: [...new Set(links)],
    images,
    issues,
    loadTime,
  };
}

/**
 * Main crawl loop. Visits pages by starting from / and following links.
 */
export async function crawlSite(
  config: Partial<CrawlerConfig> = {}
): Promise<{ pages: PageData[]; internalLinks: { from: string; to: string }[] }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const visited = new Set<string>();
  const toVisit = ['/'];
  const pages: PageData[] = [];
  const internalLinks: { from: string; to: string }[] = [];

  console.log('🔍 Rozpoczynam crawl strony...\n');
  console.log(`📌 Start: / (odkrywam strony przez linkowanie)\n`);

  while (toVisit.length > 0 && visited.size < cfg.maxPages) {
    const path = toVisit.shift()!;
    if (visited.has(path) || shouldSkip(path, cfg.skipPatterns)) continue;

    visited.add(path);
    process.stdout.write(`  [${visited.size}/${cfg.maxPages}] ${path} ... `);

    const { status, html, loadTime } = await fetchPage(path, cfg);
    const pageData = analyzePage(path, status, html, loadTime, cfg.baseUrl);

    for (const link of pageData.links) {
      if (!visited.has(link) && !shouldSkip(link, cfg.skipPatterns)) {
        toVisit.push(link);
      }
      internalLinks.push({ from: path, to: link });
    }

    if (status === 200) {
      console.log(`✅ ${status} (${loadTime}ms, ${pageData.wordCount} słów)`);
    } else {
      console.log(`❌ ${status} (${loadTime}ms)`);
    }

    pages.push(pageData);
    await sleep(cfg.requestDelay);
  }

  return { pages, internalLinks };
}
