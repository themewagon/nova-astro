import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src/components', 'src/layouts', 'src/styles', 'public/js'];
const EXTENSIONS = new Set(['.astro', '.tsx', '.ts', '.css', '.js']);
const LEGACY_TOKENS = [
  'data-reveal',
  'reveal-group',
  'auto-reveal-item',
  'animate-hero',
  'service-enter',
  'hero-enter',
  'stagger-delay',
  // Why: The attribute was never supported by motion.js (delay counted
  // is with --motion-order / --motion-auto-order) and its presence additionally
  // disables auto-reveal of the entire section.
  'data-motion-delay',
];

// Why: the engine (motion.js + motion.css) only matches exact ones
// "fade"/"viewport" and sequence "fade"/"viewport" values. Unknown value (e.g. historical
// "fade-up") does not animate the element and disables auto-reveal of the section anyway.
const ALLOWED_MOTION_VALUES = new Set(['fade', 'viewport']);
const ALLOWED_SEQUENCE_VALUES = new Set(['fade', 'viewport']);
const MOTION_ATTR_PATTERN = /data-motion(?:-sequence)?="([^"]*)"/g;

function collectFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) return collectFiles(entryPath);
    if (!EXTENSIONS.has(path.extname(entry.name))) return [];
    if (/\.(test|spec)\.[^.]+$/.test(entry.name)) return [];

    return [entryPath];
  });
}

const findings: Array<{ file: string; line: number; token: string }> = [];

for (const relativeDirectory of SCAN_DIRS) {
  for (const filePath of collectFiles(path.join(ROOT, relativeDirectory))) {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

    lines.forEach((line, index) => {
      LEGACY_TOKENS.forEach((token) => {
        if (line.includes(token)) {
          findings.push({
            file: path.relative(ROOT, filePath),
            line: index + 1,
            token,
          });
        }
      });

      // Validation of data-motion / data-motion-sequence values: each value
      // outside the whitelist is a dead attribute that additionally blocks auto-reveal.
      MOTION_ATTR_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = MOTION_ATTR_PATTERN.exec(line)) !== null) {
        const [fullMatch, value] = match;
        const isSequence = fullMatch.startsWith('data-motion-sequence');
        const allowed = isSequence ? ALLOWED_SEQUENCE_VALUES : ALLOWED_MOTION_VALUES;
        if (!allowed.has(value)) {
          findings.push({
            file: path.relative(ROOT, filePath),
            line: index + 1,
            token: `${fullMatch} (nienotowana wartosc, dozwolone: ${[...allowed].join(', ')})`,
          });
        }
      }
    });
  }
}

if (findings.length > 0) {
  console.error('Znaleziono stare tokeny animacji:');
  findings.forEach(({ file, line, token }) => {
    console.error(`- ${file}:${line}, ${token}`);
  });
  process.exit(1);
}

console.log('OK: brak starych tokenów animacji w kodzie produkcyjnym.');
