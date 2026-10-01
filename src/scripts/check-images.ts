import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { auditRenderedImages, auditSmartImageFallback } from '@utils/image-audit';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const distDir = path.join(projectRoot, 'dist');
const errors = [];

if (fs.existsSync(distDir)) {
  for (const relativePath of fg.sync('**/*.html', { cwd: distDir, ignore: ['qa/**'] })) {
    const file = path.join('dist', relativePath).replace(/\\/g, '/');
    errors.push(...auditRenderedImages(fs.readFileSync(path.join(distDir, relativePath), 'utf8'), file));
  }
}

const smartImagePath = path.join(projectRoot, 'src/components/ui/atoms/SmartImage.astro');
errors.push(...auditSmartImageFallback(
  fs.readFileSync(smartImagePath, 'utf8'),
  'src/components/ui/atoms/SmartImage.astro',
));

if (errors.length > 0) {
  console.error(`check:images: ${errors.length} issue(s) detected.`);
  errors.forEach((issue) => console.error(`${issue.file} [${issue.rule}] ${issue.message}`));
  process.exit(1);
}

console.log('check:images: rendered images and SmartImage fallback are valid.');
