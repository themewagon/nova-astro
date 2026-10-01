// Auto-counting statistics from JSON (prebuild)
// Why: customers with lists (offers, projects, services) want on the website
// "X offers / Y partners" counters, which update themselves when added
// new entries. This script counts the elements in the specified JSON arrays
// i wstrzykuje je do sekcji ze statystykami przed buildem.
//
// Use:
//   node scripts/stats-sync.mjs --source src/data/sections/offers.json:items \
//     --source src/data/sections/partners.json:items \
//     --target src/data/sections/stats.json:stats \
// --label "Active offers" --label "Partners"
//
// --source path:array-key (can be multiple times)
// --target path:target-key (where to inject [{value, label}])
// --label   etykieta kolejnej statystyki (po jednej na --source)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { sources: [], target: null, labels: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--source' && argv[i + 1]) {
      args.sources.push(argv[i + 1]);
      i += 1;
    } else if (argv[i] === '--target' && argv[i + 1]) {
      args.target = argv[i + 1];
      i += 1;
    } else if (argv[i] === '--label' && argv[i + 1]) {
      args.labels.push(argv[i + 1]);
      i += 1;
    }
  }
  return args;
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf-8'));
}

function getByKeyPath(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function setByKeyPath(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let cursor = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    cursor = cursor[keys[i]];
  }
  cursor[keys[keys.length - 1]] = value;
}

const args = parseArgs(process.argv.slice(2));

if (!args.target || args.sources.length === 0) {
  console.error('[stats-sync] Podaj --source (1+) i --target, np.:');
  console.error('  node scripts/stats-sync.mjs --source src/data/sections/offers.json:items --target src/data/sections/stats.json:stats --label "Aktywnych ofert"');
  process.exit(1);
}

const stats = args.sources.map((source, index) => {
  const [filePath, keyPath] = source.split(':');
  const data = readJson(filePath);
  const items = getByKeyPath(data, keyPath);
  const count = Array.isArray(items) ? items.length : 0;
  const label = args.labels[index] || `Elementów (${filePath})`;
  return { value: String(count), label };
});

const [targetPath, targetKey] = args.target.split(':');
const target = readJson(targetPath);
setByKeyPath(target, targetKey, stats);
writeFileSync(resolve(root, targetPath), JSON.stringify(target, null, 2) + '\n', 'utf-8');

console.log(`[stats-sync] Zaktualizowano ${targetPath}: ${stats.map((s) => `${s.value} ${s.label}`).join(', ')}`);
