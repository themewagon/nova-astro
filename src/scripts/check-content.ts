import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { auditContent } from '@utils/content-audit';

const patterns = [
  'src/pages/**/*.astro',
  'src/data/global/company.json',
  'src/data/global/seo.json',
  'src/data/navigation/**/*.json',
  'src/data/pages/**/*.json',
  'src/data/sections/**/*.json',
  'src/content/**/*.md',
  'src/content/**/*.mdoc',
  'src/config/site.ts',
  'src/config/template.ts',
  'site.config.mjs',
];

const excludePatterns = [
  '**/node_modules/**',
  'src/pages/qa/**',
];

const targets = patterns.flatMap((pattern) =>
  fg.sync(pattern, { ignore: excludePatterns }),
);

let totalIssues = 0;

for (const relativePath of targets) {
  const filePath = path.resolve(relativePath);
  if (!fs.existsSync(filePath)) {
    console.warn(`[warn] File not found: ${relativePath}`);
    continue;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const issues = auditContent(source, relativePath);

  for (const issue of issues) {
    totalIssues += 1;
    const message = issue.rule === 'polish-diacritics'
      ? 'Polish text likely misses required diacritics'
      : 'Found placeholder';
    console.error(`${issue.file}:${issue.line} [${issue.rule}] ${message}: "${issue.value}"`);
  }
}

if (totalIssues > 0) {
  console.error(`\ncheck:content: ${totalIssues} content issue(s) detected in production data.`);
  console.error('Replace placeholders and correct Polish diacritics before building for production.');
  console.error('');
  console.error('  ❗❗ POLSKIE ZNAKI SĄ OBOWIĄZKOWE ❗❗');
  console.error('  Każdy polski tekst na stronie MUSI mieć poprawne znaki diakrytyczne');
  console.error('  (ąćęłńóśźż). Tekst bez polskich znaków to KRYTYCZNY błąd jakości.');
  console.error('  Sprawdź powyższe linie i dodaj brakujące ogonki.');
  process.exitCode = 1;
} else {
  console.log(`check:content: OK — ${targets.length} files scanned, no issues.`);
}
