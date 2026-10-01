// clean-dist.mjs, ostatnia linia obrony: usuwa z dist/ dev-only śmieci,
// które mogły powstać mimo scope-pages (deny list z BUILD_SCOPE) oraz pliki
// serwerowe (send-form.php) niepotrzebne w statycznym deploymencie.
//
// WAŻNE: strony spoza zakresu NIE są tu usuwane, nie są w ogóle budowane
// (scope-pages.mjs przenosi je do _disabled/ przed astro build).
// Ten skrypt usuwa także jawnie oznaczone assety odziedziczone ze Starter Kita.
import fs from 'fs';
import path from 'path';
import { BUILD_SCOPE } from '../../site.config.mjs';

const dist = path.resolve('dist');

// Denylist działa na pierwszym segmencie ścieżki:
// Wpisy denylisty dotyczą pierwszego segmentu ścieżki, na przykład 'dev' obejmuje /dev/.
function matchesForceRemove(pathname) {
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  return BUILD_SCOPE.forceRemove.includes(firstSegment);
}

// Normalizuje relatywną ścieżkę strony do URL pathname z trailing slash
function toPathname(relativePath) {
  const parts = relativePath.split(path.sep);
  if (parts.at(-1) === 'index.html') parts.pop();
  else if (parts.at(-1) === '404.html') parts[parts.length - 1] = '404';
  const joined = parts.filter(Boolean).join('/');
  return '/' + (joined ? joined + '/' : '');
}

if (!fs.existsSync(dist)) {
  console.log('clean-dist: brak dist/, nic do zrobienia');
  process.exit(0);
}

const toRemove = [];

// Pliki serwerowe z public, których klient nie potrzebuje w statycznym dist
const publicFiles = ['send-form.php'];
for (const f of publicFiles) {
  const fullPath = path.join(dist, f);
  if (fs.existsSync(fullPath)) toRemove.push(fullPath);
}

// Katalogi i strony z deny listy (gdyby mimo scope-pages powstały)
const walkDist = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const pathname = toPathname(path.relative(dist, full) + path.sep);
      if (matchesForceRemove(pathname)) {
        toRemove.push(full);
        continue;
      }
      walkDist(full);
    } else if (entry.name.endsWith('.html')) {
      const pathname = toPathname(path.relative(dist, full));
      if (matchesForceRemove(pathname)) toRemove.push(full);
    }
  }
};
walkDist(dist);

let removed = 0;
for (const item of toRemove) {
  if (fs.existsSync(item)) {
    fs.rmSync(item, { recursive: true, force: true });
    removed++;
  }
}

// Usuń puste katalogi (bez dotykania assets/)
const pruneEmptyDirs = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    pruneEmptyDirs(full);
    if (fs.readdirSync(full).length === 0) fs.rmSync(full, { recursive: true, force: true });
  }
};
pruneEmptyDirs(dist);

console.log(`clean-dist: usunieto ${removed} elementow deny listy/pliki public z dist/`);
