// scope-pages.mjs - DOES NOT build pages outside BUILD_SCOPE instead of cleaning them up after build.
//
// ⚠️ ⚠️ ⚠️ RULE FOR AI (APPLICABLE TO EVERY PROJECT) - READ BEFORE YOU DO ANYTHING ⚠️ ⚠️ ⚠️
// NIGDY nie zostawiaj stron w src/pages/_disabled/ — ani w starter-kicie,
// ani w projekcie klienta skopiowanym z niego! Ten folder jest ignorowany
// by Astro, so after moving the dev and qa pages these addresses return 404.
// IN THE STARTER KIT - DON'T DO THIS IN ANY PROJECT.
//
// ZASADY:
// 1. stage() is to be called ONLY by `npm run build` (build script),
// which ALWAYS does restore() in `finally`. Never manually: `node src/scripts/scope-pages.mjs stage`.
// 2. If you see files in src/pages/_disabled/ - DO NOT create new ones, DO NOT edit them,
//    tylko NATYCHMIAST uruchom: `node src/scripts/scope-pages.mjs restore`
//    (albo `npm run scope:restore`, patrz package.json).
// 3. After each of your work, check that src/pages/_disabled/ is EMPTY:
//    `Get-ChildItem src/pages/_disabled -Recurse -File | Measure-Object`
// If not empty → restore + only then report completion.
// 4. Nigdy nie commituj stanu z plikami w _disabled/.
//
// How it works:
//   stage   — przenosi pliki .astro spoza zakresu (allowlist BUILD_SCOPE.pages
//             oraz deny list forceRemove) z src/pages/ do src/pages/_disabled/.
// The _disabled folder is ignored by Astro, so non-pages
// scopes are not created at all in dist/ (no cleanup after build,
// zero risk of removing necessary CSS/JS).
//   restore — przywraca przeniesione pliki z powrotem do src/pages/ (dev dalej
//             ma wszystko). Manifest w node_modules/.cache (nie commitowany).
//
// Usage: node src/scripts/scope-pages.mjs stage|restore|build
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { BUILD_SCOPE } from '../../site.config.mjs';

const pagesDir = path.resolve('src/pages');
const disabledDir = path.join(pagesDir, '_disabled');
const cacheDir = path.resolve('node_modules/.cache');
const manifestPath = path.join(cacheDir, 'scope-pages-manifest.json');

// ⚠️ SAFETY GUARD (anti-footgun): if there is a manifest from the previous stage,
// this means that the previous build did not complete the restore (it crashed, was interrupted,
// or someone started the stage manually). Instead of overwriting the manifest and leaving it
// strony w _disabled, NAJPIERW przywracamy wszystko z poprzedniej sesji.
// This ensures that _disabled never accumulates pages (works identically
// after copying the starter kit to the client's project - the rule is universal).
function ensureNoStaleManifest() {
  if (fs.existsSync(manifestPath)) {
    console.warn('⚠️ scope-pages: znaleziono manifest z poprzedniej sesji (stage bez restore). Przywracam strony...');
    restore();
  }
}

// Files that are NEVER moved:
//   [...page].astro  — catch-all (filtrowany w getStaticPaths, patrz [...page].astro)
// 404.astro - error page, always remains
const ALWAYS_KEEP = new Set(['[...page].astro', '404.astro']);

// Analogicznie do clean-dist: nazwa pliku .astro -> URL pathname.
// 'index.astro' -> '/', 'kontakt.astro' -> '/kontakt/', 'pl/cookies.astro' -> '/pl/cookies/'
function astroPathname(relativePath) {
  const parts = relativePath.split(path.sep).filter(Boolean);
  // Zdejmij rozszerzenie z nazwy pliku (ostatni segment)
  const file = parts.at(-1).replace(/\.astro$/, '');
  parts[parts.length - 1] = file;
  if (file === 'index') parts.pop();
  else if (file === '404') parts[parts.length - 1] = '404';
  const joined = parts.filter(Boolean).join('/');
  return '/' + (joined ? joined + '/' : '');
}

// Prefix match: '/pl' pasuje do '/pl/', '/pl/cookies/', ale NIE do '/pl-xyz/'.
// Root '/' pasuje TYLKO do '/', nigdy do podstron.
function matchesPrefix(pathname, prefix) {
  const normalized = prefix.endsWith('/') ? prefix : prefix + '/';
  if (normalized === '/') return pathname === '/';
  return pathname === normalized || pathname.startsWith(normalized);
}

// Denylist works on the first path segment:
// Denylist operates on the first path segment, for example 'dev' includes /dev/.
function matchesForceRemove(pathname) {
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  return BUILD_SCOPE.forceRemove.includes(firstSegment);
}

function isAllowed(pathname) {
  if (matchesForceRemove(pathname)) return false;
  // pages: [] = wszystkie strony dozwolone
  if (!BUILD_SCOPE.pages || BUILD_SCOPE.pages.length === 0) return true;
  return BUILD_SCOPE.pages.some((p) => matchesPrefix(pathname, p));
}

// Zbiera wszystkie pliki .astro w src/pages (bez _disabled)
function collectAstroFiles() {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('_')) continue; // _disabled already omitted
        walk(full);
      } else if (entry.name.endsWith('.astro')) {
        files.push(path.relative(pagesDir, full));
      }
    }
  };
  walk(pagesDir);
  return files;
}

// Returns the relative paths of all .astro files in src/pages/_disabled/
// (used for final verification after build - _disabled must be empty).
function walkFiles(dir) {
  const files = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.astro')) files.push(path.relative(disabledDir, full));
    }
  };
  walk(dir);
  return files;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stage() {
  if (!fs.existsSync(pagesDir)) {
    console.log('scope-pages: brak src/pages, nic do zrobienia');
    return;
  }
  ensureDir(cacheDir);

  // ⚠️ Safety guard: restore pages from a previous, unfinished session
  // instead of re-staged to a copy of them (cumulative in _disabled).
  ensureNoStaleManifest();

  const moved = [];
  for (const rel of collectAstroFiles()) {
    if (ALWAYS_KEEP.has(rel)) continue;
    const pathname = astroPathname(rel);
    if (isAllowed(pathname)) continue;

    const src = path.join(pagesDir, rel);
    const dest = path.join(disabledDir, rel);
    ensureDir(path.dirname(dest));
    // Overwrite any old copy in _disabled (garbage from previous sessions)
    if (fs.existsSync(dest)) fs.rmSync(dest, { force: true });
    fs.renameSync(src, dest);
    moved.push(rel);
    console.log(`scope-pages: wyłączono ${rel} (${pathname})`);
  }

  fs.writeFileSync(manifestPath, JSON.stringify(moved, null, 2));
  console.log(`scope-pages: przeniesiono ${moved.length} stron spoza zakresu do _disabled/`);
}

function restore() {
  if (!fs.existsSync(manifestPath)) {
    console.log('scope-pages: brak manifestu, nic do przywrócenia');
    return;
  }
  const moved = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let restored = 0;
  for (const rel of moved) {
    const src = path.join(disabledDir, rel);
    const dest = path.join(pagesDir, rel);
    if (!fs.existsSync(src)) continue;
    ensureDir(path.dirname(dest));
    if (fs.existsSync(dest)) fs.rmSync(dest, { force: true });
    fs.renameSync(src, dest);
    restored++;
  }
  fs.rmSync(manifestPath, { force: true });
  console.log(`scope-pages: przywrocono ${restored} stron z _disabled/`);
}

function build() {
  let staged = false;
  let exitCode = 1;

  try {
    stage();
    staged = true;

    // Invoke Astro's JS entry point through Node so Windows shell quoting is not
    // dependent on whether the project path contains spaces.
    const astroCli = path.resolve('node_modules', 'astro', 'bin', 'astro.mjs');
    const result = spawnSync(process.execPath, [astroCli, 'build'], {
      stdio: 'inherit',
    });

    if (result.error) {
      console.error(`scope-pages: nie udało się uruchomić Astro: ${result.error.message}`);
      exitCode = 1;
    } else {
      exitCode = result.status ?? 1;
    }
  } finally {
    // The build may fail, but the source files must be returned to
    // src/pages so that another dev server doesn't run on an incomplete tree.
    if (staged) restore();

    // ⚠️ Final verification: _disabled MUST be empty after build.
    // If it isn't, something went wrong (e.g. orphaned files without a manifest)
    // and the dev server will lose pages (404). We print a clear error so that the agent
    // did not consider the task complete until the pages were returned.
    const orphans = fs.existsSync(disabledDir)
      ? walkFiles(disabledDir)
      : [];
    if (orphans.length > 0) {
      console.error(`⛔ scope-pages: src/pages/_disabled/ NIE jest pusty po buildzie (${orphans.length} plików).`);
      console.error(`   Dev server zgubi strony (dev/components, studio, qa). Uruchom natychmiast:`);
      console.error(`   npm run scope:restore`);
      for (const rel of orphans) console.error(`   - ${rel}`);
    }
  }

  process.exitCode = exitCode;
}

const command = process.argv[2];
if (command === 'stage') stage();
else if (command === 'restore') restore();
else if (command === 'build') build();
else {
  console.error('Uzycie: node src/scripts/scope-pages.mjs stage|restore|build');
  process.exit(1);
}
