import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';

/**
 * Check hardcoded content in Astro components.
 * Scans for inline Polish/English text in component templates that should
 * live in JSON data files instead.
 *
 * Usage: npx tsx src/scripts/check-hardcoded.ts
 *
 * Exit code 1 when hardcoded content is found (blocks pre-commit).
 */

const COMPONENTS_GLOB = 'src/components/**/*.astro';
const LAYOUTS_GLOB = 'src/layouts/**/*.astro';
const PAGES_GLOB = 'src/pages/**/*.astro';

// Why: dev/demo and QA files are not client content, we omit them in the hook.
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  'src/pages/qa/**',
  'src/pages/dev/**',
  // QA files moved to _disabled are not rendered, they are not client content
  'src/pages/_disabled/**',
  // Development components are internal tooling, not client content.
  'src/components/dev/**',
  'src/components/ui/atoms/MockupMedia.astro',
  // Unused molecules from copy UI (no use in sections, not client content)
  'src/components/ui/molecules/FilterCard.astro',
  'src/components/ui/molecules/AvatarStack.astro',
];

// Why: UI copies (technical labels) may remain in the code.
// These are not client content, just interface constants (e.g. "More" in pagination).
const ALLOWED_LABELS = new Set([
  'Więcej',
  'Mniej',
  'Wstecz',
  'Dalej',
  'Poprzednia',
  'Następna',
  // Empty state RoomDetailBlock: UI message, not client content
  'Galeria zostanie uzupełniona.',
  // Contact form UI labels are allowed in data-driven components.
  'Strona internetowa',
  'Imię',
  'Nazwisko',
  'Email',
  'Wiadomość',
  'politykę prywatności',
  'Adres firmy',
  // Calculator UI labels are allowed in data-driven components.
  'Wybierz usługę',
  'Wybrana usługa',
  'Dodatkowe opcje',
  'brak',
  'Szacunkowa wartość:',
  // Product certification names are allowed in data-driven components.
  'PEFC',
]);

// Text to detect: content of HTML tags with Polish characters or longer
// phrases that look like content (not like class/attr).
const TEXT_RE = />([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż][^<>{}]{3,120}?)<\//g;

// Expressions in braces { ... } contain data from JSON/props, we omit it.
const EXPR_RE = /\{[\s\S]*?\}/g;

function scanFile(filePath: string): { line: number; text: string }[] {
  const source = fs.readFileSync(filePath, 'utf8');
  // Remove frontmatter (--- ... ---)
  const withoutFrontmatter = source.replace(/^---[\s\S]*?---/, '');
  // Remove scripts and styles
  const withoutScripts = withoutFrontmatter
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  // Remove HTML comments
  const withoutComments = withoutScripts.replace(/<!--[\s\S]*?-->/g, '');
  // Remove JS expressions (data from JSON/props)
  const withoutExpressions = withoutComments.replace(EXPR_RE, '{}');

  const lines = withoutExpressions.split('\n');
  const findings: { line: number; text: string }[] = [];

  lines.forEach((lineContent, index) => {
    let match: RegExpExecArray | null;
    const re = new RegExp(TEXT_RE.source, 'g');
    while ((match = re.exec(lineContent)) !== null) {
      const text = match[1].trim();
      // We skip short words and pure classes
      if (text.length < 4) continue;
      // Pomijamy czyste tagi HTML bez tekstu
      if (/^(div|span|p|a|li|ul|ol|h[1-6]|section|nav|header|footer|main|aside|figure|figcaption|button|label|form|input|textarea|select|option|img|picture|source|time|small|strong|em|b|i|br|hr|table|thead|tbody|tr|th|td|article|details|summary|blockquote|code|pre|sup|sub|mark|q|cite|abbr|kbd|samp|var|dl|dt|dd|address|fieldset|legend|meter|progress|output|iframe|video|audio|canvas|svg|g|path|circle|rect|line|polyline|polygon|text|title|desc|use|defs|symbol|clipPath|mask|linearGradient|radialGradient|stop|filter|pattern|marker|view|glyph|missing-glyph|altGlyph|altGlyphDef|altGlyphItem|glyphRef|tref|textPath|tspan|animate|animateColor|animateMotion|animateTransform|set|mpath|cursor|font|font-face|font-face-format|font-face-name|font-face-src|font-face-uri|hkern|vkern|foreignObject|switch|metadata|style|script|base|link|meta|title|head|body|html|template|slot|option|optgroup|col|colgroup|caption|summary|datalist|keygen|menuitem|rp|rt|ruby|wbr|param|source|track|desc|fe|use)[\s>]/i.test(text)
      ) {
        continue;
      }
      // Pomijamy atrybuty (np. "target="_blank"")
      if (/^[a-z-]+="/i.test(text)) continue;
      // Pomijamy dozwolone kopie UI
      if (ALLOWED_LABELS.has(text)) continue;
      // We skip texts starting with technical names
      if (/^(data-|aria-|class|id|name|href|src|alt|type|rel|target|role|style)/i.test(text)) continue;

      findings.push({ line: index + 1, text });
    }
  });

  return findings;
}

const targets = [
  ...fg.sync(COMPONENTS_GLOB, { ignore: EXCLUDE_PATTERNS }),
  ...fg.sync(LAYOUTS_GLOB, { ignore: EXCLUDE_PATTERNS }),
  ...fg.sync(PAGES_GLOB, { ignore: EXCLUDE_PATTERNS }),
];

let totalIssues = 0;
const report: { file: string; line: number; text: string }[] = [];

for (const relativePath of targets) {
  const filePath = path.resolve(relativePath);
  if (!fs.existsSync(filePath)) continue;

  const findings = scanFile(filePath);
  for (const finding of findings) {
    totalIssues += 1;
    report.push({ file: relativePath, line: finding.line, text: finding.text });
  }
}

if (totalIssues > 0) {
  console.error(`\ncheck:hardcoded: ${totalIssues} hardcoded content issue(s) detected.\n`);
  for (const item of report) {
    console.error(`  ${item.file}:${item.line}  "${item.text}"`);
  }
  console.error('\nPrzenieś te treści do src/data/**.json (SSOT) zamiast trzymać je w komponentach.');
  process.exitCode = 1;
} else {
  console.log(`check:hardcoded: OK — ${targets.length} files scanned, no hardcoded content.`);
}
