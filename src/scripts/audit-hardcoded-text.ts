/**
 * Audit hardcoded text in registry blocks.
 * Scans for inline demo data arrays and hardcoded Polish/English strings.
 *
 * Usage: npx tsx src/scripts/audit-hardcoded-text.ts
 *
 * Output: list of files with hardcoded text that should be extracted to JSON.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(import.meta.dirname, '..');
const REGISTRY_DIR = join(ROOT, 'components', 'registry');
const DATA_DIR = join(ROOT, 'data', 'sections');

interface AuditEntry {
  file: string;
  type: 'demo-array' | 'hardcoded-text' | 'fallback-pattern';
  detail: string;
  lines: string[];
}

function findJsDocComment(content: string, pos: number): string {
  const before = content.slice(Math.max(0, pos - 200), pos);
  const commentMatch = before.match(/\/\*\*[\s\S]{0,300}?\*\//);
  return commentMatch ? commentMatch[0].slice(0, 120) : '';
}

function scanFile(filePath: string): AuditEntry[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const result: AuditEntry[] = [];
  const relPath = relative(join(ROOT, '..'), filePath);

  // 1. Find demo data arrays (const demoX = [...])
  const demoArrayRegex = /const\s+(demo\w+|default\w+)\s*[=:]\s*\[/g;
  let match: RegExpExecArray | null;
  while ((match = demoArrayRegex.exec(content)) !== null) {
    const lineNum = content.slice(0, match.index).split('\n').length;
    const snippet = lines[lineNum - 1]?.trim() || match[0];
    result.push({
      file: relPath,
      type: 'demo-array',
      detail: `Inline demo array: ${match[1]}`,
      lines: [snippet, lines[lineNum]?.trim() || ''].filter(Boolean),
    });
  }

  // 2. Find fallback patterns (x ? x : demoX)
  const fallbackRegex = /(items|list|members|testimonials|stats)\s*&&\s*\1\.length\s*>\s*0\s*\?\s*\1\s*:\s*(demo\w+|default\w+)/g;
  while ((match = fallbackRegex.exec(content)) !== null) {
    const lineNum = content.slice(0, match.index).split('\n').length;
    result.push({
      file: relPath,
      type: 'fallback-pattern',
      detail: `Fallback: uses demo data when no props passed`,
      lines: [lines[lineNum - 1]?.trim() || match[0]],
    });
  }

  // 3. Find hardcoded Polish/English UI strings in template (not props, not imports)
  const textRegex = />([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż][^<]{3,80}?)<\//g;
  const excludedKeywords = ['div', 'span', 'class', 'href', 'src', 'alt', 'svg', 'path',
    'button', 'label', 'input', 'form', 'header', 'footer', 'section', 'nav', 'main',
    'title', 'description', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'br', 'hr',
    'img', 'figure', 'figcaption', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr',
    'th', 'td', 'aside', 'article', 'details', 'summary', 'slot'];

  while ((match = textRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text.length < 5 || text.includes('{{') || text.includes('slot')) continue;
    if (excludedKeywords.some(k => text.toLowerCase().startsWith(k))) continue;
    if (/^[a-z]/.test(text)) continue;

    const lineNum = content.slice(0, match.index).split('\n').length;
    const comment = findJsDocComment(content, match.index);

    // Check if it's a known demo-data config
    const line = lines[lineNum - 1] || '';
    if (line.includes('props.') || line.includes('Astro.props') || line.includes('slot=')) continue;

    result.push({
      file: relPath,
      type: 'hardcoded-text',
      detail: `Hardcoded text: "${text.slice(0, 80)}"`,
      lines: [line.trim()],
    });
  }

  return result;
}

function scanDir(dir: string): AuditEntry[] {
  const results: AuditEntry[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanDir(fullPath));
    } else if (entry.name.endsWith('.astro')) {
      results.push(...scanFile(fullPath));
    }
  }
  return results;
}

// Main
console.log('\n=== AUDYT HARCODED TEXTU ===\n');
console.log(`Data JSONs available: ${existsSync(DATA_DIR) ? readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).join(', ') : 'NONE'}\n`);

const entries = scanDir(REGISTRY_DIR);

const byType: Record<string, AuditEntry[]> = {};
for (const e of entries) {
  if (!byType[e.type]) byType[e.type] = [];
  byType[e.type].push(e);
}

for (const [type, items] of Object.entries(byType)) {
  console.log(`\n── ${type.toUpperCase()} (${items.length}) ──`);
  const byFile: Record<string, AuditEntry[]> = {};
  for (const item of items) {
    if (!byFile[item.file]) byFile[item.file] = [];
    byFile[item.file].push(item);
  }
  for (const [file, fileItems] of Object.entries(byFile)) {
    console.log(`\n  ${file}`);
    for (const item of fileItems.slice(0, 5)) {
      console.log(`    ${item.detail}`);
      for (const line of item.lines) {
        if (line) console.log(`      → ${line.slice(0, 100)}`);
      }
    }
    if (fileItems.length > 5) {
      console.log(`    ... (+${fileItems.length - 5} more)`);
    }
  }
}

const total = entries.length;
console.log(`\n\n=== PODSUMOWANIE ===`);
console.log(`  Demo arrays (inline): ${byType['demo-array']?.length || 0}`);
console.log(`  Fallback patterns:    ${byType['fallback-pattern']?.length || 0}`);
console.log(`  Hardcoded text:       ${byType['hardcoded-text']?.length || 0}`);
console.log(`  TOTAL issues:         ${total}`);
console.log(`\nData JSONs: ${existsSync(DATA_DIR) ? readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).length : 0} files`);
console.log('\n✅ Done. Review results and extract text to JSON as needed.');
