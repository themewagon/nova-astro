import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const CHECK_ONLY = process.argv.includes('--check');
const WEIGHT_CLASSES = new Set(['bold', 'duotone', 'fill', 'light', 'thin']);
const ICON_RULE_RE = /\.ph\.ph-([a-z0-9-]+):before\s*\{[^}]*?content\s*:\s*["'][^"']+["'];?[^}]*?\}/gi;

function collectFiles(dir, extension) {
  if (!fs.existsSync(dir)) return [];

  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(fullPath, extension));
    else if (!extension || entry.name.endsWith(extension)) files.push(fullPath);
  }
  return files;
}

function collectUsedIcons() {
  const used = new Set();

  // HTML covers icons rendered by Astro, and JS also covers states changed after
  // page load, for example switching the copy icon to success.
  const files = [...collectFiles(distDir, '.html'), ...collectFiles(distDir, '.js')];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const className of source.matchAll(/\bph-([a-z0-9-]+)\b/gi)) {
      if (!WEIGHT_CLASSES.has(className[1].toLowerCase())) used.add(className[1].toLowerCase());
    }
  }

  return used;
}

function findIconSelectors(css) {
  const selectors = new Set();
  for (const match of css.matchAll(ICON_RULE_RE)) selectors.add(match[1].toLowerCase());
  return selectors;
}

if (!fs.existsSync(distDir)) {
  throw new Error('Brak katalogu dist/. Uruchom najpierw npm run build.');
}

const usedIcons = collectUsedIcons();
let removedRules = 0;
let cssFiles = 0;

for (const file of collectFiles(distDir, '.css')) {
  const originalCss = fs.readFileSync(file, 'utf8');
  if (!originalCss.includes('.ph.ph-')) continue;

  cssFiles += 1;
  const optimizedCss = CHECK_ONLY
    ? originalCss
    : originalCss.replace(ICON_RULE_RE, (rule, iconName) => {
      if (usedIcons.has(iconName.toLowerCase())) return rule;
      removedRules += 1;
      return '';
    });

  if (!CHECK_ONLY && optimizedCss !== originalCss) fs.writeFileSync(file, optimizedCss, 'utf8');
}

const availableIcons = new Set();
for (const file of collectFiles(distDir, '.css')) {
  const css = fs.readFileSync(file, 'utf8');
  for (const iconName of findIconSelectors(css)) availableIcons.add(iconName);
}

const missingIcons = [...usedIcons].filter((iconName) => !availableIcons.has(iconName));
if (missingIcons.length > 0) {
  throw new Error(`Brak definicji CSS dla ikon użytych w dist: ${missingIcons.join(', ')}`);
}

console.log(
  `phosphor: ${CHECK_ONLY ? 'sprawdzono' : `usunięto ${removedRules} nieużywanych reguł w`} ${cssFiles} plikach CSS; używane ikony: ${usedIcons.size}`,
);
