import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { auditMobileSource } from '@utils/mobile-layout-audit';

const patterns = [
  'src/components/ui/atoms/**/*.astro',
  'src/components/ui/layout/**/*.astro',
  'src/components/ui/molecules/Navbar/**/*.astro',
  'src/components/ui/molecules/Footer.astro',
  'src/components/ui/molecules/CookieConsent.astro',
  'src/components/registry/**/*.astro',
];

const targets = patterns.flatMap((pattern) => fg.sync(pattern, { ignore: ['**/node_modules/**'] }));

const entries: { file: string; rule: string; line: number; reason: string }[] = [];

for (const relativePath of targets) {
  const filePath = path.resolve(relativePath);
  if (!fs.existsSync(filePath)) continue;
  for (const issue of auditMobileSource(fs.readFileSync(filePath, 'utf8'))) {
    if (true) { // capture all severities
      entries.push({
        file: relativePath.replace(/\\/g, '/'),
        rule: issue.rule,
        line: issue.line,
        reason: 'Pre-existing — do refaktoryzacji w osobnym tasku',
      });
    }
  }
}

const output = { _comment: 'Auto-generated. Run: npm run check:baseline-update', entries };
fs.writeFileSync(path.resolve('.audit-baseline.json'), JSON.stringify(output, null, 2) + '\n');
console.log(`Baseline generated: ${entries.length} entries.`);
