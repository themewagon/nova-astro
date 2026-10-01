/**
 * Sprawdza czy importy uzywaja aliasow zamiast relatywnych sciezek.
 * Aliasy (`@components/`, `@utils/`) sa preferowane nad `../`.
 * Importy w obrebie tego samego katalogu (`./`) sa OK.
 *
 * Usage: npx tsx src/scripts/check-import-paths.ts
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { basename, dirname, join, relative, resolve, sep } from 'path';

const ROOT = join(import.meta.dirname, '..');

interface Violation {
  file: string;
  line: string;
  relativePath: string;
}

const violations: Violation[] = [];

const SRC_DIR = join(ROOT);

function scanFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = relative(join(ROOT, '..'), filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/from\s+['"]((\.\.\/)+[^'"]+)['"]/);
    if (match) {
      const importedPath = resolve(dirname(filePath), match[1]);
      const isAllowedRootConfig =
        !importedPath.startsWith(`${SRC_DIR}${sep}`) && basename(importedPath) === 'site.config.mjs';

      // site.config.mjs is a consciously shared file outside of src,
      // therefore it cannot use the aliases configured for src.
      if (isAllowedRootConfig) continue;

      violations.push({
        file: relPath,
        line: line.trim().slice(0, 120),
        relativePath: match[1],
      });
    }
  }
}

function scanDir(dir: string): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.astro') return;
      scanDir(fullPath);
    } else if ((entry.name.endsWith('.astro') || entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.endsWith('.test.ts')) {
      scanFile(fullPath);
    }
  }
}

console.log('\n=== Import Path Check: Aliasy vs Relatywne ===\n');

scanDir(SRC_DIR);

if (violations.length === 0) {
  console.log('✅ Wszystkie importy uzywaja aliasow lub sa w obrebie katalogu.\n');
  process.exit(0);
}

// Group by file, showing depth
const byDepth: Record<string, Violation[]> = {};
for (const v of violations) {
  const depth = v.relativePath.startsWith('../../../') ? '3+' : v.relativePath.startsWith('../../') ? '2' : '1';
  if (!byDepth[depth]) byDepth[depth] = [];
  byDepth[depth].push(v);
}

for (const [depth, items] of Object.entries(byDepth)) {
  console.log(`\n── Poziom ${depth} (${items.length}) ──`);
  for (const item of items) {
    console.log(`  ${item.file}`);
    console.log(`    → ${item.line}`);
  }
}

console.log(`\n=== Podsumowanie ===`);
console.log(`  Relatywnych importow wyzej (../): ${violations.length}`);
console.log(`  Dozwolone: importy w obrebie katalogu (./), aliasy (@components/, @utils/...).`);
console.log(`\n❌ Zamien na aliasy: @components/, @utils/, @data/, @config/ itd.\n`);

process.exit(1);
