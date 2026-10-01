// check-polish.ts
// Validation of Polish characters and pauses in template content.
// Detects: U+FFFD (�) wildcard character, \uXXXX sequences of Polish characters in sources,
// words written without Polish tails and em/en dash pauses in visible texts.
// Returns exit code 1 when any problems are found.

import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';

const patterns = [
  'src/**/*.{astro,ts,json,md}',
  'public/**/*.{html,js}',
];

const excludePatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.astro/**',
  'src/scripts/check-polish.ts',
];

// Polish words whose correct form always requires diacritics.
// Any occurrence of a listed ASCII root is treated as an error.
const WORDS_REQUIRING_DIACRITICS: Record<string, string> = {
  prosze: 'proszę',
  dziekuje: 'dziękuję',
  usluga: 'usługa',
  wysylka: 'wysyłka',
  zamowienie: 'zamówienie',
  tresc: 'treść',
};

// These roots may be valid without diacritics, so they require a contextual check.
const WORDS_TO_VERIFY: Record<string, string> = {
  szukaj: 'szukaj (sprawdź kontekst, np. "szukają")',
  cena: 'cena (sprawdź kontekst, np. "cenę")',
  kontakt: 'kontakt (sprawdź kontekst)',
  strona: 'strona (sprawdź kontekst, np. "stronę")',
  pomoc: 'pomoc (sprawdź kontekst, np. "pomocą")',
  przycisk: 'przycisk (sprawdź kontekst)',
  obrazek: 'obrazek (sprawdź kontekst)',
};

// Common word pattern: word boundary in front, any simple inflectional suffix in back
const wordPattern = new RegExp(
  `\\b(?:${Object.keys({ ...WORDS_REQUIRING_DIACRITICS, ...WORDS_TO_VERIFY }).join('|')})\\w*`,
  'gi',
);

// Checks whether a Unicode code point represents a Polish diacritic.
function isPolishCodePoint(code: number): boolean {
  return (
    (code >= 0x0104 && code <= 0x0107) || // Ąą Ćć
    (code >= 0x0118 && code <= 0x0119) || // Ęę
    (code >= 0x0141 && code <= 0x0144) || // Łł Ńń
    (code >= 0x015a && code <= 0x015b) || // Śś
    (code >= 0x0179 && code <= 0x017c) || // Źź Żż
    code === 0x00d3 ||
    code === 0x00f3 // Óó
  );
}

type Issue = {
  file: string;
  line: number;
  rule: string;
  message: string;
  value: string;
};

const issues: Issue[] = [];
let scannedFiles = 0;

function report(issue: Issue): void {
  issues.push(issue);
}

// Extracts strings (single, double, template) from lines of code.
// It is used to check words and pauses on literals only, not identifiers.
function extractStrings(line: string): string[] {
  const strings: string[] = [];
  const re = /(["'`])((?:[^\\\n]|\\.)*?)\1/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    strings.push(match[2]);
  }
  return strings;
}

// Detects the U+FFFD wildcard character and sequences of \uXXXX Polish characters
function checkBrokenCharacters(line: string, filePath: string, lineNo: number): void {
  const brokenRe = /\uFFFD/g;
  let match: RegExpExecArray | null;
  while ((match = brokenRe.exec(line)) !== null) {
    report({
      file: filePath,
      line: lineNo,
      rule: 'broken-char',
      message: 'U+FFFD (�) placeholder in content, fix file encoding (UTF-8)',
      value: line.slice(Math.max(0, match.index - 20), match.index + 20),
    });
  }

  // Unicode-escape sequences, e.g. \u0105 (a) written instead of a UTF-8 literal
  const unicodeRe = /\\u[0-9a-fA-F]{4}/g;
  while ((match = unicodeRe.exec(line)) !== null) {
    const code = parseInt(match[0].slice(2), 16);
    if (isPolishCodePoint(code)) {
      const literal = String.fromCharCode(code);
      report({
        file: filePath,
        line: lineNo,
        rule: 'unicode-escape',
        message: `Sequence \\u${code.toString(16).toUpperCase()} (character "${literal}") in source, replace with UTF-8 literal`,
        value: match[0],
      });
    }
  }
}

// Detects words written without Polish tails
function checkWords(line: string, filePath: string, lineNo: number): void {
  let match: RegExpExecArray | null;
  while ((match = wordPattern.exec(line)) !== null) {
    const word = match[0].toLowerCase();
    const certain = WORDS_REQUIRING_DIACRITICS[word] || WORDS_REQUIRING_DIACRITICS[word.replace(/s$/, '')];
    if (certain) {
      report({
        file: filePath,
        line: lineNo,
        rule: 'missing-diacritics',
        message: `The word "${match[0]}" written without Polish tails, the correct form is "${certain}"`,
        value: match[0],
      });
    } else {
      const verify = WORDS_TO_VERIFY[word] || WORDS_TO_VERIFY[Object.keys(WORDS_TO_VERIFY).find((k) => word.startsWith(k)) ?? ''];
      if (verify) {
        report({
          file: filePath,
          line: lineNo,
          rule: 'missing-diacritics-verify',
          message: `The word "${match[0]}" appears to be written without any tails, ${verify}`,
          value: match[0],
        });
      }
    }
  }
}

// Detects forbidden long dash characters in visible text.
function checkDashes(line: string, filePath: string, lineNo: number): void {
  const dashRe = /[—–]/g;
  let match: RegExpExecArray | null;
  while ((match = dashRe.exec(line)) !== null) {
    const isEm = match[0] === '\u2014';
    report({
      file: filePath,
      line: lineNo,
      rule: isEm ? 'em-dash' : 'en-dash',
      message: isEm
        ? 'Pause em dash (—) in text, use a comma, semicolon, period or bracket'
        : 'Pause en dash (–) in text, use a comma, semicolon, period or bracket',
      value: line.slice(Math.max(0, match.index - 20), match.index + 20),
    });
  }
}

// Checks a line in markup mode (whole line after removing comments) or in code mode (strings only)
function scanLine(line: string, filePath: string, lineNo: number, codeMode: boolean): void {
  checkBrokenCharacters(line, filePath, lineNo);
  const target = codeMode ? extractStrings(line).join('\n') : line;
  if (target.length === 0) return;
  checkWords(target, filePath, lineNo);
  checkDashes(target, filePath, lineNo);
}

const targets = patterns.flatMap((pattern) => fg.sync(pattern, { ignore: excludePatterns }));

for (const relativePath of targets) {
  const filePath = path.resolve(relativePath);
  if (!fs.existsSync(filePath)) {
    console.warn(`[warn] File not found: ${relativePath}`);
    continue;
  }

  let source = fs.readFileSync(filePath, 'utf8');
  scannedFiles += 1;

  // Remove block comments (/* */ and <!-- -->), keeping line numbers
  source = source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  source = source.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));

  const lines = source.split('\n');
  let inScript = false;

  lines.forEach((rawLine, index) => {
    const lineNo = index + 1;

    // Switching code/markup mode on <script> sections (astro/html)
    if (!inScript && /<script[\s>]/i.test(rawLine)) inScript = true;
    const codeMode = inScript;
    if (/<\/script>/i.test(rawLine)) inScript = false;

    let line = rawLine;
    if (!codeMode) {
      // Linear comments // (but not after a colon, so as not to truncate https://)
      line = line.replace(/(^|[^:])\/\/.*$/g, '$1');
    }

    scanLine(line, relativePath, lineNo, codeMode);
  });
}

if (issues.length > 0) {
  console.error(`check:polish: znaleziono ${issues.length} problemów w ${scannedFiles} plikach:`);
  console.error('');
  for (const issue of issues) {
    console.error(`${issue.file}:${issue.line} [${issue.rule}] ${issue.message}: "${issue.value}"`);
  }
  console.error('');
  console.error('  ❗❗ POLSKIE ZNAKI I PAUZY SĄ OBOWIĄZKOWE ❗❗');
  console.error('  Każdy polski tekst MUSI mieć poprawne znaki diakrytyczne (ąćęłńóśźż).');
  console.error('  Pauzy em dash (—) i en dash (–) są zakazane, użyj przecinka, średnika lub nawiasu.');
  process.exitCode = 1;
} else {
  console.log(`check:polish: OK — ${scannedFiles} plików przeskanowano, brak problemów.`);
}
