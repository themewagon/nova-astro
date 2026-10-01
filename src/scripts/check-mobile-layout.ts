import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { auditMobileSource } from '@utils/mobile-layout-audit';
import { isKnownBaselineIssue } from '@utils/mobile-audit-baseline';
import type { BaselineEntry } from '@utils/mobile-audit-baseline';

const args = process.argv.slice(2);
const filesFlag = args.indexOf('--files');
const explicitFiles = filesFlag >= 0 ? args.slice(filesFlag + 1).filter((arg) => !arg.startsWith('--')) : [];
const strictMode = args.includes('--strict');

function loadBaseline(): BaselineEntry[] {
  const baselinePath = path.resolve('.audit-baseline.json');
  if (!fs.existsSync(baselinePath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    return raw.entries || [];
  } catch {
    return [];
  }
}

const defaultPatterns = [
  'src/components/ui/atoms/**/*.astro',
  'src/components/ui/layout/**/*.astro',
  'src/components/ui/molecules/Navbar/**/*.astro',
  'src/components/ui/molecules/Footer.astro',
  'src/components/ui/molecules/CookieConsent.astro',
  'src/components/registry/**/*.astro',
];

const discoveredTargets: string[] = explicitFiles.length > 0
  ? explicitFiles
  : defaultPatterns.flatMap((pattern) => fg.sync(pattern, { ignore: ['**/node_modules/**'] }));
const targets = discoveredTargets;

if (targets.length === 0) {
  console.error('No target files found for mobile audit.');
  process.exitCode = 1;
} else {
  const baseline = loadBaseline();
  let newErrors = 0;
  let knownCount = 0;
  let warningCount = 0;

  for (const relativePath of targets) {
    const filePath = path.resolve(relativePath);
    if (!fs.existsSync(filePath)) {
      console.error(`Mobile audit file not found: ${relativePath}`);
      newErrors += 1;
      continue;
    }

    for (const issue of auditMobileSource(fs.readFileSync(filePath, 'utf8'))) {
      const known = isKnownBaselineIssue(baseline, relativePath, issue);

      if (known) {
        knownCount += 1;
        if (strictMode) {
          if (issue.severity === 'error') newErrors += 1;
          console.error(`${relativePath}:${issue.line} [${issue.rule}] ${issue.message} (KNOWN)`);
        } else {
          console.log(`${relativePath}:${issue.line} [${issue.rule}] ${issue.message} (KNOWN)`);
        }
      } else {
        if (issue.severity === 'error') {
          newErrors += 1;
          console.error(`${relativePath}:${issue.line} [${issue.rule}] ${issue.message}`);
        } else {
          warningCount += 1;
          console.warn(`${relativePath}:${issue.line} [${issue.rule}] ${issue.message} (warning)`);
        }
      }
    }
  }

  console.log(`\nMobile audit: ${newErrors} new error(s), ${knownCount} known legacy, ${warningCount} warning(s).`);
  if (newErrors > 0) {
    process.exitCode = 1;
    console.error('FAIL: New mobile violations found. Fix them or update .audit-baseline.json if intentional.');
  } else {
    console.log('PASS: No new mobile violations.');
  }
}
