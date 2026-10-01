import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { maskSourceComments } from '@utils/source-comments';

export interface LinkIssue {
  file: string;
  line: number;
  rule: string;
  href: string;
  message: string;
}

export interface RouteMap {
  validRoutes: Set<string>;
}

export function normalizePath(p: string): string {
  let normalized = p.replace(/\\/g, '/');
  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  if (normalized.endsWith('/') && normalized !== '/') normalized = normalized.slice(0, -1);
  return normalized;
}

export function buildRouteMap(): RouteMap {
  const validRoutes = new Set<string>();

  validRoutes.add('/');

  const pagesDir = path.resolve('src/pages');
  if (fs.existsSync(pagesDir)) {
    const pageFiles = fg.sync('**/*.astro', { cwd: pagesDir });
    for (const file of pageFiles) {
      const routePath = file
        .replace(/\\/g, '/')
        .replace(/\/?index\.astro$/, '')
        .replace(/\.astro$/, '')
        .replace(/\[\.\.\.page\]/, '');
      const route = '/' + routePath;
      if (route !== '/') validRoutes.add(route);
    }
  }

  const jsonPaths = [
    'src/data/navigation/header.json',
    'src/data/navigation/footer.json',
    'src/data/pages/index.json',
  ];

  for (const relPath of jsonPaths) {
    const absPath = path.resolve(relPath);
    if (fs.existsSync(absPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(absPath, 'utf8'));
        collectRoutesFromData(data, validRoutes);
      } catch {
        // skip unparseable JSON
      }
    }
  }

  const textPaths = ['src/config/template.ts'];
  const hrefRegex = /["'`]\/([^"'`\s?]+)["'`]/g;
  for (const relPath of textPaths) {
    const absPath = path.resolve(relPath);
    if (fs.existsSync(absPath)) {
      const content = fs.readFileSync(absPath, 'utf8');
      let m: RegExpExecArray | null;
      while ((m = hrefRegex.exec(content)) !== null) {
        const route = '/' + m[1].replace(/\/$/, '');
        if (route !== '/' && !/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|eot|mp4|webm|pdf|zip)$/i.test(route)) {
          validRoutes.add(route);
        }
      }
    }
  }

  return { validRoutes };
}

function collectRoutesFromData(data: unknown, routes: Set<string>, maxDepth = 10): void {
  if (maxDepth <= 0) return;
  if (typeof data === 'string') {
    if (data.startsWith('/') && !data.startsWith('//') && !data.startsWith('http')) {
      if (/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|eot|mp4|webm|pdf|zip)$/i.test(data)) return;
      const route = data.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
      if (route !== '/') routes.add(route);
    }
    return;
  }
  if (Array.isArray(data)) {
    for (const item of data) collectRoutesFromData(item, routes, maxDepth - 1);
    return;
  }
  if (data && typeof data === 'object') {
    for (const val of Object.values(data as Record<string, unknown>)) {
      collectRoutesFromData(val, routes, maxDepth - 1);
    }
  }
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href) || /^\/\//.test(href);
}

export function isSpecial(href: string): boolean {
  return /^(mailto:|tel:|javascript:|data:)/i.test(href);
}

export function isAnchorOnly(href: string): boolean {
  return /^#\w/.test(href);
}

export interface ExtractedLink {
  href: string;
  line: number;
}

// Match must start from standalone attribute. Without word boundary
// regex could also catch Astro props, e.g. `promoCtaHref = ""`.
const HREF_HTML_REGEX = /(?<![\w-])href\s*=\s*["']([^"']*)["']/gi;
const HREF_JSON_REGEX = /"href"\s*:\s*"([^"]+)"/gi;

export function extractLinks(source: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  let match: RegExpExecArray | null;

  while ((match = HREF_HTML_REGEX.exec(source)) !== null) {
    const lineNum = source.slice(0, match.index).split('\n').length;
    links.push({ href: match[1], line: lineNum });
  }

  while ((match = HREF_JSON_REGEX.exec(source)) !== null) {
    const lineNum = source.slice(0, match.index).split('\n').length;
    if (!links.some((l) => l.href === match![1] && l.line === lineNum)) {
      links.push({ href: match[1], line: lineNum });
    }
  }

  return links;
}

const EXCLUDED_PATHS = [
  'src/data/qa/',
  'src/pages/qa/',
  'src/components/dev/',
  '.audit-baseline.json',
  '.docs/',
];

function isExcluded(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return EXCLUDED_PATHS.some((p) => normalized.startsWith(p));
}

function isSectionFixture(filePath: string): boolean {
  return filePath.replace(/\\/g, '/').startsWith('src/data/sections/');
}

export function auditLinks(
  source: string,
  filePath: string,
  routes: RouteMap,
): LinkIssue[] {
  const issues: LinkIssue[] = [];

  if (isExcluded(filePath)) return issues;

  // Why: HTML comments go to dist and contain code examples
  // (e.g. "tag=\"h1\"" in HeroBlock) which regex counted as real
  // headings -> false [multiple-h1]. We audit only visible markup.
  const isHtml = filePath.startsWith('dist/') && filePath.endsWith('.html');
  const auditedSource = isHtml ? source.replace(/<!--[\s\S]*?-->/g, '') : source;

  const links = extractLinks(maskSourceComments(source));

  const normalizedFilePath = filePath.replace(/\\/g, '/');
  const isPage = normalizedFilePath.startsWith('src/pages/')
    && !normalizedFilePath.startsWith('src/pages/dev/')
    && filePath.endsWith('.astro');
  // Dlaczego: rzeczywisty nagłówek stron z PageBuilderem powstaje dopiero po
  // renderowaniu sekcji, dlatego jego obecność sprawdzamy w wygenerowanym HTML.
  const usesPageBuilder = /<PageBuilder\b/.test(auditedSource);
  if ((isPage && !usesPageBuilder) || (filePath.startsWith('dist/') && filePath.endsWith('.html'))) {
    if (filePath.includes('qa/') || filePath.includes('404') || filePath.includes('[...page]')) return issues;

    const explicitH1 = (auditedSource.match(/<h1\b[^>]*>/gi) || []).length;
    const componentH1 = (auditedSource.match(/Heading[^>]*level\s*=\s*\{?\s*1\s*\}?/gi) || []).length;
    const tagH1 = (auditedSource.match(/tag\s*=\s*["']h1["']/gi) || []).length;
    const variantHero = (auditedSource.match(/variant\s*=\s*["']hero["']/gi) || []).length;
    const layoutTitle = (auditedSource.match(/<\w+Layout\b[^>]*\btitle\s*=\s*\{/gi) || []).length;
    const totalH1 = explicitH1 + componentH1 + tagH1 + variantHero + layoutTitle;

    if (totalH1 === 0) {
      issues.push({
        file: filePath,
        line: 1,
        rule: 'missing-h1',
        href: '',
        message: 'Page has no <h1> heading. Every public page must have exactly one h1.',
      });
    } else if (totalH1 > 1) {
      issues.push({
        file: filePath,
        line: 1,
        rule: 'multiple-h1',
        href: '',
        message: `Page has ${totalH1} <h1> headings. There must be exactly one h1 per page.`,
      });
    }
  }

  for (const match of source.matchAll(/action\s*=\s*["']#["']/gi)) {
    const lineNum = source.slice(0, match.index).split('\n').length;
    issues.push({
      file: filePath,
      line: lineNum,
      rule: 'empty-form-action',
      href: match[1],
      message: 'Form action="#" submits to the current page, which may cause unexpected behavior. Use a real endpoint or remove action for same-page handling.',
    });
  }

  for (const link of links) {
    const h = link.href;

    if (h === '#' || h.trim() === '') {
      if (filePath.startsWith('dist/')) continue;
      issues.push({
        file: filePath,
        line: link.line,
        rule: 'empty-href',
        href: h,
        message: `href="${h}" causes page scroll to top or is an empty link.`,
      });
      continue;
    }

    if (isExternal(h) || isSpecial(h) || isAnchorOnly(h)) {
      continue;
    }

    const isAsset = /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|eot|mp4|webm|pdf|zip)$/i.test(h);
    if (isAsset) continue;

    if (h.startsWith('/')) {
      const validateRoute = !isSectionFixture(filePath);
      if (validateRoute && h !== '/' && !h.endsWith('/') && !h.includes('?') && !h.includes('#')) {
        issues.push({
          file: filePath,
          line: link.line,
          rule: 'trailing-slash',
          href: h,
          message: `Internal link "${h}" must use a trailing slash.`,
        });
      }

      const routeOnly = normalizePath(h.split('#')[0].split('?')[0]);
      if (validateRoute && routeOnly !== '/' && !routes.validRoutes.has(routeOnly)) {
        issues.push({
          file: filePath,
          line: link.line,
          rule: 'broken-route',
          href: h,
          message: `Link "${h}" points to unknown route "${routeOnly}".`,
        });
      }
    }
  }

  return issues;
}
