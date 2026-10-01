import { maskSourceComments } from '@utils/source-comments';

export type MobileAuditSeverity = 'error' | 'warning';

export interface MobileAuditIssue {
  rule: string;
  severity: MobileAuditSeverity;
  message: string;
  line: number;
}

const IGNORE_MARKER = 'mobile-audit-ignore';

function lineNumber(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function ignored(line: string): boolean {
  return line.includes(IGNORE_MARKER);
}

function addIssue(
  issues: MobileAuditIssue[],
  source: string,
  index: number,
  rule: string,
  severity: MobileAuditSeverity,
  message: string,
) {
  const lineStart = source.lastIndexOf('\n', index) + 1;
  const lineEnd = source.indexOf('\n', index) === -1 ? source.length : source.indexOf('\n', index);
  if (!ignored(source.slice(lineStart, lineEnd))) {
    issues.push({ rule, severity, message, line: lineNumber(source, index) });
  }
}

const INTERACTIVE_TAGS = new Set(['a', 'button', 'input', 'select', 'textarea']);
const DEBOUNCE_INTERVAL = 50;
const pendingIssues = new Map<string, ReturnType<typeof setTimeout>>();

function issueLine(source: string, index: number): number {
  return lineNumber(source, index);
}

export function auditMobileSource(source: string): MobileAuditIssue[] {
  const issues: MobileAuditIssue[] = [];
  const auditedSource = maskSourceComments(source);

  for (const match of auditedSource.matchAll(/(?<!\bmax-)w-\[(\d+(?:\.\d+)?)px\]|\bmin-w-\[(\d+(?:\.\d+)?)px\]/g)) {
    const val = match[1] || match[2];
    if (val && Number(val) > 320) {
      addIssue(issues, source, match.index ?? 0, 'fixed-width', 'error',
        `Fixed ${val}px width can overflow a narrow viewport.`);
    }
  }

  for (const match of auditedSource.matchAll(/class(?:Name)?=["'`]([^"'`]*)(?:["'`])/g)) {
    const classes = match[1];
    if (/(?:^|\s)(?:md|lg):(?:flex|grid|block|inline-flex)(?=\s|$)/.test(classes) && !/(?:^|\s)(?:hidden|flex|grid|block|inline-flex)(?=\s|$)/.test(classes)) {
      addIssue(issues, source, match.index ?? 0, 'mobile-first-layout', 'error',
        'Desktop layout has no mobile base display class.');
    }
    if (classes.includes('overflow-x-hidden')) {
      addIssue(issues, source, match.index ?? 0, 'hidden-overflow', 'warning',
        'Avoid using hidden overflow to conceal an unresolved layout problem.');
    }
  }

  for (const match of auditedSource.matchAll(/<(section|p|h[1-6])\b/g)) {
    addIssue(issues, source, match.index ?? 0, 'atomic-markup', 'warning',
      `Use the shared atom or layout component instead of raw <${match[1]}> markup.`);
  }

  for (const match of auditedSource.matchAll(/href=["'](\/(?!\/)[^"']*)["']/g)) {
    const href = match[1];
    if (href !== '/' && !href.endsWith('/') && !href.includes('?') && !href.includes('#')) {
      addIssue(issues, source, match.index ?? 0, 'internal-link', 'error',
        `Internal link "${href}" must use a trailing slash or formatInternalLink().`);
    }
  }

  for (const match of auditedSource.matchAll(/clamp\(\s*[^,]+,\s*([^,]+),/g)) {
    if (!/\b(?:vw|vh|cqw|cqh)\b/.test(match[1])) {
      addIssue(issues, source, match.index ?? 0, 'fluid-type', 'warning',
        'Preferred clamp value should use a viewport or container unit.');
    }
  }

  for (const match of auditedSource.matchAll(/class(?:Name)?=["'`]([^"'`]*)(?:["'`])/g)) {
    const c = match[1];
    if (/\bw-screen\b/.test(c) && !/\b(?:overflow-hidden|max-w-|container)\b/.test(c)) {
      addIssue(issues, source, match.index ?? 0, 'full-viewport-width', 'warning',
        'w-screen without a safe overflow/max-width constraint may cause horizontal scroll.');
    }
  }

  for (const match of auditedSource.matchAll(/style\s*=\s*["'`][^"'`]*width\s*:\s*(\d+)/gi)) {
    const w = parseInt(match[1], 10);
    if (w > 320) {
      addIssue(issues, source, match.index ?? 0, 'inline-width', 'error',
        `Inline width ${w}px may overflow a narrow viewport.`);
    }
  }

  for (const match of auditedSource.matchAll(/class(?:Name)?=["'`]([^"'`]*\bwhitespace-nowrap\b[^"'`]*)["'`]/g)) {
    const lineStart = source.lastIndexOf('\n', match.index ?? 0) + 1;
    const lineEnd = source.indexOf('\n', match.index ?? 0) === -1 ? source.length : source.indexOf('\n', match.index ?? 0);
    const line = source.slice(lineStart, lineEnd);
    if (line.includes(IGNORE_MARKER)) continue;
    const c = match[1];
    const contextStart = Math.max(0, (match.index ?? 0) - 2000);
    const context = auditedSource.slice(contextStart, match.index ?? 0);
    const isMarquee = /\bmarquee\b/i.test(line + c) ||
      /\bmarquee\b/i.test(context) ||
      /animation.*marquee/i.test(context) ||
      /marquee-scroll/i.test(context) ||
      /data-mobile-marquee/i.test(context) ||
      /data-mobile-marquee/i.test(line);
    if (!isMarquee) {
      addIssue(issues, source, match.index ?? 0, 'no-wrap-text', 'warning',
        'whitespace-nowrap on non-marquee content may cause overflow on narrow screens.');
    }
  }

  for (const match of auditedSource.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?class(?:Name)?=["'`]([^"'`]*)["'`][^>]*>/g)) {
    const tag = match[1].toLowerCase();
    if (tag === 'nav' || tag === 'a' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') continue;
    const attrs = match[0];
    const classes = match[2];
    if (/\b(?:flex|grid)\b/.test(classes) && !/\bmin-w-0\b/.test(classes) && !/\bmin-w-\[0\]\b/.test(classes)) {
      const content = auditedSource.slice(match.index ?? 0);
      const nearText = /[><]/.test(content.slice(0, 200));
      if (nearText) {
        addIssue(issues, source, match.index ?? 0, 'missing-min-width', 'warning',
          'Flex/grid container with text may need min-w-0 to prevent overflow by child content.');
      }
    }
  }

  for (const match of auditedSource.matchAll(/<(a|button|input|select|textarea)\b([^>]*?)>/gi)) {
    const attrs = match[2];
    const hasClass = /class(?:Name)?=/i.test(attrs);
    const hasSize = /size|=h-/i.test(attrs);
    if (hasClass || hasSize) {
      const wrapper = match[0];
      const hasLargeTouch = /\bh-(?:9|10|11|12)\b/.test(wrapper) || /\bmin-h-\[44px\]\b/.test(wrapper) || /\bmin-h-\[48px\]\b/i.test(wrapper);
      if (!hasLargeTouch) {
        addIssue(issues, source, match.index ?? 0, 'touch-target', 'warning',
          `<${match[1]}> may have a touch target smaller than 44px.`);
      }
    }
  }

  for (const match of auditedSource.matchAll(/<img\b([^>]*?)>/gi)) {
    const imgAttrs = match[1];
    if (!/alt\s*=/i.test(imgAttrs)) {
      addIssue(issues, source, match.index ?? 0, 'missing-alt', 'error',
        '<img> is missing the alt attribute.');
    }
    if (!/\bwidth\s*=/i.test(imgAttrs)) {
      addIssue(issues, source, match.index ?? 0, 'missing-width', 'error',
        '<img> is missing the width attribute.');
    }
    if (!/\bheight\s*=/i.test(imgAttrs)) {
      addIssue(issues, source, match.index ?? 0, 'missing-height', 'error',
        '<img> is missing the height attribute.');
    }
  }

  for (const match of auditedSource.matchAll(/<(div|aside)\b([^>]*?role\s*=\s*["']dialog["'][^>]*)>/gi)) {
    const attrs = match[2];
    if (!/aria-modal\s*=\s*["']true["']/i.test(attrs)) {
      addIssue(issues, source, match.index ?? 0, 'drawer-aria-modal', 'error',
        'Dialog element should have aria-modal="true".');
    }
    if (!/aria-label\s*=/i.test(attrs) && !/aria-labelledby\s*=/i.test(attrs)) {
      addIssue(issues, source, match.index ?? 0, 'drawer-aria-label', 'error',
        'Dialog element should have an aria-label or aria-labelledby.');
    }
  }

  for (const match of auditedSource.matchAll(/<button\b([^>]*?data-navbar-toggle[^>]*)>/gi)) {
    const attrs = match[1];
    if (!/aria-controls\s*=/i.test(attrs)) {
      addIssue(issues, source, match.index ?? 0, 'drawer-toggle-controls', 'error',
        'Navbar toggle button should have aria-controls pointing to the drawer.');
    }
    if (!/aria-label\s*=/i.test(attrs) && !/aria-labelledby\s*=/i.test(attrs)) {
      addIssue(issues, source, match.index ?? 0, 'drawer-toggle-label', 'error',
        'Navbar toggle button should have an aria-label.');
    }
    if (!/aria-expanded\s*=/i.test(attrs)) {
      addIssue(issues, source, match.index ?? 0, 'drawer-toggle-expanded', 'warning',
        'Navbar toggle button should have aria-expanded to indicate drawer state.');
    }
  }

  for (const match of auditedSource.matchAll(/href=["']#["']/g)) {
    addIssue(issues, source, match.index ?? 0, 'empty-href', 'error',
      'href="#" links cause page scroll to top, use a real URL or button instead.');
  }

  for (const match of auditedSource.matchAll(/@media\s*\(\s*hover\s*:\s*hover\s*\)\s*\{/gi)) {
    addIssue(issues, source, match.index ?? 0, 'hover-only', 'warning',
      'hover: hover media query may hide content from touch-only users.');
  }

  for (const match of auditedSource.matchAll(/<(a|button)\b([^>]*?)class(?:Name)?=["'`]([^"'`]*hover[^"'`]*)["'`]([^>]*?)>/gi)) {
    const tag = match[1];
    const preClass = match[2];
    const postClass = match[4];
    const combined = preClass + postClass;
    const hasFocusVisible = /focus-visible|focus:/i.test(combined);
    const hasAria = /aria-/i.test(combined);
    if (!hasFocusVisible && !hasAria) {
      addIssue(issues, source, match.index ?? 0, 'hover-interaction', 'warning',
        `<${tag}> with hover effect may need focus-visible or aria fallback for touch/keyboard.`);
    }
  }

  return issues;
}
