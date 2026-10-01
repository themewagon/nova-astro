import fs from 'node:fs';
import path from 'node:path';
import { SECTION_REGISTRY } from '@config/section-registry';
import { auditPageConfig, auditRegistryDefaults, getSectionDataKeys } from '@utils/page-registry-audit';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const pagesDir = path.join(projectRoot, 'src', 'data', 'pages');

// Dlaczego: component-map jest teraz automatyczny (import.meta.glob nad
// src/components/registry/**/*.astro), so we do not parse the component names
// from file - we take them from real files in the registry directory (recursively).
// Navbar is the only component outside the registry (ui/molecules), we add it manually.
function collectComponentNames(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const names: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      names.push(...collectComponentNames(full));
    } else if (e.name.endsWith('.astro')) {
      names.push(e.name.replace(/\.astro$/, ''));
    }
  }
  return names;
}
const registryDir = path.join(projectRoot, 'src', 'components', 'registry');
const componentNames = new Set([
  ...collectComponentNames(registryDir),
  'Navbar',
]);
const registryErrors = auditRegistryDefaults(SECTION_REGISTRY);
const errors = [...registryErrors];
const pageFiles = fs.readdirSync(pagesDir)
  .filter((name) => name.endsWith('.json') && name !== '_registry.ts')
  .filter((name) => {
    const config = JSON.parse(fs.readFileSync(path.join(pagesDir, name), 'utf8')) as {
      enabled?: unknown;
      heading?: unknown;
      sections?: unknown;
    };

    // The pages folder also contains standalone data, for example blog.json,
    // and 404 configuration disabled. This audit applies to PageBuilder only.
    return config.enabled !== false && (Array.isArray(config.sections) || typeof config.heading === 'string');
  });

for (const file of pageFiles) {
  const pagePath = path.join(pagesDir, file);
  const config = JSON.parse(fs.readFileSync(pagePath, 'utf8')) as unknown;
  errors.push(...auditPageConfig(
    path.relative(projectRoot, pagePath),
    config as Parameters<typeof auditPageConfig>[1],
    {
      registry: SECTION_REGISTRY,
      sectionDataKeys: getSectionDataKeys(projectRoot),
      componentNames,
    },
  ));
}

if (errors.length > 0) {
  console.error(`check:page-registry: ${errors.length} issue(s) detected.`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`check:page-registry: ${pageFiles.length} page(s) and registry defaults are valid.`);
