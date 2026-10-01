import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { auditLinks, buildRouteMap } from '@utils/link-audit';

const scanPatterns = [
  'src/components/**/*.astro',
  'src/pages/**/*.astro',
  'src/data/**/*.json',
  'src/config/template.ts',
  'src/layouts/**/*.astro',
];

const excludePatterns = [
  '**/node_modules/**',
  'src/data/qa/**',
  'src/pages/qa/**',
  '.audit-baseline.json',
];

let targets: string[] = scanPatterns.flatMap((pattern) =>
  fg.sync(pattern, { ignore: excludePatterns }),
);

const routes = buildRouteMap();
const distDir = path.resolve('dist');
if (fs.existsSync(distDir)) {
  const distHtml = fg.sync('**/*.html', { cwd: distDir, ignore: ['**/qa/**'] });
  targets = targets.concat(distHtml.map((f) => `dist/${f}`));

  // Static Astro output is the authoritative route list for generated pages,
  // including concrete paths produced from dynamic routes such as blog slugs.
  for (const file of distHtml) {
    const route = `/${file.replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '')}`;
    routes.validRoutes.add(route === '/' ? '/' : route.replace(/\/$/, ''));
  }
}

let totalIssues = 0;

for (const relativePath of targets) {
  const filePath = path.resolve(relativePath);
  if (!fs.existsSync(filePath)) continue;

  const source = fs.readFileSync(filePath, 'utf8');
  const issues = auditLinks(source, relativePath, routes);

  for (const issue of issues) {
    totalIssues += 1;
    console.error(
      `${issue.file}:${issue.line} [${issue.rule}] ${issue.message}`,
    );
  }
}

if (totalIssues > 0) {
  console.error(`\ncheck:links: ${totalIssues} link issue(s) detected.`);
  process.exitCode = 1;
} else {
  console.log(`check:links: No link issues detected (${targets.length} file(s) scanned).`);
}
