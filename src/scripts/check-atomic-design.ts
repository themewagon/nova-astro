/**
 * Atomic Design Compliance Checker.
 * Validates component hierarchy, banned patterns, and conventions.
 *
 * Usage: npx tsx src/scripts/check-atomic-design.ts
 *        npm run check:atomic
 *
 * Exit code: 0 = clean, 1 = violations found
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, relative, resolve } from 'path';

const ROOT = join(import.meta.dirname, '..');
const UI_DIR = join(ROOT, 'components', 'ui');
const ATOMS_DIR = join(UI_DIR, 'atoms');
const MOLECULES_DIR = join(UI_DIR, 'molecules');
const LAYOUT_DIR = join(UI_DIR, 'layout');
const REGISTRY_DIR = join(ROOT, 'components', 'registry');
const BLOCKS_DIR = join(ROOT, 'components', 'blocks');

interface Violation {
  file: string;
  type: string;
  detail: string;
  line: string;
}

const violations: Violation[] = [];

// ── Helpers ──

const EXTERNAL_ALLOWED = ['@utils', '@data', '@config', '@styles', '@assets', '@content', '@layouts'];

function isExternalImport(imp: string): boolean {
  return (
    imp.startsWith('.') === false &&
    EXTERNAL_ALLOWED.some((p) => imp.startsWith(p)) === false &&
    imp.startsWith('@components') === false
  ) || imp.startsWith('node:') || imp.startsWith('astro');
}

function getImportLayer(filePath: string): 'atoms' | 'molecules' | 'layout' | 'registry' | 'blocks' | 'other' {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.includes('/ui/atoms/')) return 'atoms';
  if (normalized.includes('/ui/molecules/')) return 'molecules';
  if (normalized.includes('/ui/layout/')) return 'layout';
  if (normalized.includes('/registry/')) return 'registry';
  if (normalized.includes('/blocks/')) return 'blocks';
  return 'other';
}

/** Returns the path to the molecule/block directory for the files inside it*/
function getMoleculeRoot(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, '/');
  // For molecules: extracts /ui/molecules/MolecularName/
  const molMatch = normalized.match(/(\/ui\/molecules\/[^/]+\/)/);
  if (molMatch) return molMatch[1];
  const regMatch = normalized.match(/(\/registry\/[^/]+\.astro$)/);
  if (regMatch) return null;
  return null;
}

const LAYER_ORDER: Record<string, number> = {
  atoms: 0,
  layout: 1,
  molecules: 2,
  registry: 3,
  blocks: 3,
};

function parseImports(content: string): string[] {
  const imports: string[] = [];
  const regex = /import\s+(?:[\w{}*\s,]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function resolveLayer(importPath: string): string | null {
  if (isExternalImport(importPath)) return 'external';
  if (importPath.startsWith('@components/ui/atoms') || importPath.includes('/ui/atoms/')) return 'atoms';
  if (importPath.startsWith('@components/ui/molecules') || importPath.includes('/ui/molecules/')) return 'molecules';
  if (importPath.startsWith('@components/ui/layout') || importPath.includes('/ui/layout/')) return 'layout';
  if (importPath.startsWith('@components/registry') || importPath.includes('/registry/')) return 'registry';
  if (importPath.startsWith('@components/blocks') || importPath.includes('/blocks/')) return 'blocks';
  if (importPath.startsWith('.')) {
    const resolved = join(ROOT, 'components', relative(join(ROOT, 'components'), join(importPath)));
    return getImportLayer(resolved);
  }
  return 'unknown';
}

// ── Check 1: Import hierarchy ──

function checkImportHierarchy(filePath: string, content: string): void {
  const layer = getImportLayer(filePath);
  if (layer === 'other') return;

  const sourceRoot = getMoleculeRoot(filePath);
  const imports = parseImports(content);
  const layerRank = LAYER_ORDER[layer];

  for (const imp of imports) {
    const targetLayer = resolveLayer(imp);
    if (targetLayer === 'external' || targetLayer === 'unknown') continue;

    const targetRank = targetLayer ? LAYER_ORDER[targetLayer] : undefined;
    if (targetRank === undefined) continue;

    if (targetRank < layerRank) continue;

    // Allow imports within the same molecule (e.g. Navbar/layouts/ → Navbar/shared/)
    if (imp.startsWith('.') || (imp.startsWith('@components') && targetLayer === layer)) {
      const resolved = imp.startsWith('.')
        ? join(filePath, '..', imp)
        : join(ROOT, 'components', imp.replace('@components/', ''));
      const targetRoot = getMoleculeRoot(resolved);
      if (sourceRoot && targetRoot && sourceRoot === targetRoot) continue;
    }

    const relPath = relative(join(ROOT, '..'), filePath);
    violations.push({
      file: relPath,
      type: 'import-hierarchy',
      detail: `${layer} imports from ${targetLayer} (${imp}) — violates downward-only rule`,
      line: imp,
    });
  }
}

// ── Check 2: Banned patterns ──

function checkBannedPatterns(filePath: string, content: string): void {
  const relPath = relative(join(ROOT, '..'), filePath);
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fake quotes: border-l-2 and pl-8 together
    if (
      line.includes('border-l-2') &&
      line.includes('pl-8') &&
      (filePath.endsWith('.astro'))
    ) {
      violations.push({
        file: relPath,
        type: 'fake-quote',
        detail: 'Fake blockquote via border-l-2 + pl-8 — use Quote component instead',
        line: line.trim().slice(0, 120),
      });
    }

    // Textual pills are advisory. Round icon controls, avatars, glows and
    // progress tracks are valid UI patterns and must not be reported as badges.
    const isTextualPill = line.includes('rounded-full')
      && /\bpx-(?:\d|\[)/.test(line)
      && /(?:\buppercase\b|\btracking-|\btext-(?:xs|sm|\[))/.test(line)
      && !/<(?:button|Button|a)\b/.test(line)
      && !line.includes('aria-hidden="true"');
    if (isTextualPill && /\bbg-brand-(?:primary|accent|dark)/.test(line)) {
      violations.push({
        file: relPath,
        type: 'pill-badge',
        detail: 'Review textual pill badge and prefer a minimalist label when possible',
        line: line.trim().slice(0, 120),
      });
    }

    // Hardcoded colors: text-[#...] or bg-[#...]
    const hexColorMatch = line.match(/(?:text|bg|border)-\[#([0-9a-fA-F]{3,8})\]/);
    if (hexColorMatch) {
      violations.push({
        file: relPath,
        type: 'hardcoded-color',
        detail: `Hardcoded color #${hexColorMatch[1]} — use design token instead`,
        line: line.trim().slice(0, 120),
      });
    }

    // Hardcoded Tailwind colors: text-blue-500, bg-red-100, etc.
    const twColorMatch = line.match(/(?:text|bg|border)-(?:red|blue|green|yellow|purple|pink|indigo|teal|cyan|orange|amber|lime|emerald|violet|fuchsia|rose|sky)-[0-9]{2,3}/);
    if (twColorMatch) {
      violations.push({
        file: relPath,
        type: 'hardcoded-color',
        detail: `Hardcoded Tailwind color (${twColorMatch[0]}) — use design token instead`,
        line: line.trim().slice(0, 120),
      });
    }

    // Pulsing dots: animate-pulse + rounded-full
    if (line.includes('animate-pulse') && line.includes('rounded-full')) {
      violations.push({
        file: relPath,
        type: 'pulsing-dot',
        detail: 'Pulsing dot detected — banned per AI_STANDARDS.md',
        line: line.trim().slice(0, 120),
      });
    }
  }
}

// ── Check 3: Raw HTML tags (should use Text/Heading) ──

function checkRawTags(filePath: string, content: string): void {
  const relPath = relative(join(ROOT, '..'), filePath);

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip lines that are inside the atom definitions themselves
    if (filePath.includes('/atoms/Text.astro') || filePath.includes('/atoms/Heading.astro')) continue;

    // Skip template literal / JSX / string lines
    if (line.trim().startsWith('const') || line.trim().startsWith('let') || line.trim().startsWith('var')) continue;
    if (line.includes("`") || line.includes("'") || line.includes('"')) continue;

    // Check for raw <p> tags
    if (line.match(/<p[\s>]/) && !line.includes('Astro') && !line.includes('import')) {
      violations.push({
        file: relPath,
        type: 'raw-html-tag',
        detail: 'Raw <p> tag — use Text.astro component instead',
        line: line.trim().slice(0, 120),
      });
    }

    // Check for raw h1-h6 tags
    const headingMatch = line.match(/<h([1-6])[\s>]/);
    if (headingMatch && !line.includes('Astro') && !line.includes('import')) {
      violations.push({
        file: relPath,
        type: 'raw-html-tag',
        detail: `Raw <h${headingMatch[1]}> tag — use Heading.astro component instead`,
        line: line.trim().slice(0, 120),
      });
    }
  }
}

// ── Check 4: Layout spacing classes on atoms ──

function checkLayoutOnAtoms(filePath: string, content: string): void {
  if (!filePath.includes('/ui/atoms/')) return;

  const relPath = relative(join(ROOT, '..'), filePath);
  const lines = content.split('\n');
  const spacingRegex = /\b(m[tb]-[0-9]|m[tb]-\[)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (filePath.includes('/atoms/Button.astro') || filePath.includes('/atoms/card/')) continue;

    if (spacingRegex.test(line) && !line.trim().startsWith('//') && !line.includes('import')) {
      violations.push({
        file: relPath,
        type: 'layout-on-atom',
        detail: 'Atom should not contain margin-top/bottom — use parent container',
        line: line.trim().slice(0, 120),
      });
    }
  }
}

// ── Check 5: CSS animation-fill-mode blokuje transition ──

function checkCssAnimationConflict(filePath: string, content: string): void {
  const relPath = relative(join(ROOT, '..'), filePath);
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // animation-fill-mode: both lub forwards blokuje transition
    if (line.match(/animation-fill-mode\s*:\s*(both|forwards)/)) {
      violations.push({
        file: relPath,
        type: 'animation-fill-mode',
        detail: 'animation-fill-mode: ' + line.match(/animation-fill-mode\s*:\s*(both|forwards)/)![1] + ' blokuje CSS Transition — uzyj transition zamiast @keyframes lub dodaj data-animation-once do elementu',
        line: line.trim().slice(0, 120),
      });
    }
  }
}

// ── File scanning ──

function scanFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  checkImportHierarchy(filePath, content);
  checkBannedPatterns(filePath, content);
  checkRawTags(filePath, content);
  checkLayoutOnAtoms(filePath, content);
  checkCssAnimationConflict(filePath, content);
}

function scanDir(dir: string): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.name.endsWith('.astro') || entry.name.endsWith('.tsx')) {
      scanFile(fullPath);
    }
  }
}

// ── Main ──

console.log('\n=== Atomic Design Compliance Check ===\n');

const dirs = [ATOMS_DIR, MOLECULES_DIR, LAYOUT_DIR, REGISTRY_DIR, BLOCKS_DIR];

// obsluga --scan-dirs dla dodatkowych katalogow (np. src/components/mariston)
const scanDirsIndex = process.argv.indexOf('--scan-dirs');
if (scanDirsIndex !== -1 && process.argv[scanDirsIndex + 1]) {
  const extraDirs = process.argv[scanDirsIndex + 1].split(',').map(function(d) { return resolve(d.trim()); });
  dirs.push.apply(dirs, extraDirs);
}

for (const dir of dirs) {
  scanDir(dir);
}

const blockingViolations = violations.filter((violation) => violation.type !== 'pill-badge');

if (violations.length === 0) {
  console.log('✅ All components pass Atomic Design checks.\n');
  process.exit(0);
}

const byType: Record<string, Violation[]> = {};
for (const v of violations) {
  if (!byType[v.type]) byType[v.type] = [];
  byType[v.type].push(v);
}

for (const [type, items] of Object.entries(byType)) {
  console.log(`\n── ${type.toUpperCase()} (${items.length}) ──`);
  const byFile: Record<string, Violation[]> = {};
  for (const item of items) {
    if (!byFile[item.file]) byFile[item.file] = [];
    byFile[item.file].push(item);
  }
  for (const [file, fileItems] of Object.entries(byFile)) {
    console.log(`  ${file}`);
    for (const item of fileItems) {
      console.log(`    ${item.detail}`);
      console.log(`    → ${item.line}`);
    }
  }
}

console.log(`\n\n=== PODSUMOWANIE ===`);
console.log(`  Import hierarchy:     ${byType['import-hierarchy']?.length || 0}`);
console.log(`  Fake quotes:          ${byType['fake-quote']?.length || 0}`);
console.log(`  Pill badges:          ${byType['pill-badge']?.length || 0}`);
console.log(`  Hardcoded colors:     ${byType['hardcoded-color']?.length || 0}`);
console.log(`  Pulsing dots:         ${byType['pulsing-dot']?.length || 0}`);
console.log(`  Raw HTML tags:        ${byType['raw-html-tag']?.length || 0}`);
console.log(`  Layout on atoms:      ${byType['layout-on-atom']?.length || 0}`);
console.log(`  Animation fill-mode:  ${byType['animation-fill-mode']?.length || 0}`);
console.log(`  Blocking violations:  ${blockingViolations.length}`);
console.log(`  Advisory findings:    ${violations.length - blockingViolations.length}`);

if (blockingViolations.length > 0) {
  console.log('\nFix blocking violations and run the check again.\n');
  process.exit(1);
}

console.log('\nAll blocking Atomic Design checks pass.\n');
process.exit(0);
