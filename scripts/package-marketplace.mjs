import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseDir = path.join(projectRoot, 'release');
const archivePath = path.join(releaseDir, 't001-nova.zip');

mkdirSync(releaseDir, { recursive: true });
rmSync(archivePath, { force: true });

try {
  // Archive is created from HEAD so local build output and unrelated dirty files cannot leak into the sale package.
  execFileSync('git', ['archive', '--format=zip', `--output=${archivePath}`, 'HEAD'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });
} catch (error) {
  rmSync(archivePath, { force: true });
  console.error('Nie udało się utworzyć paczki marketplace z aktualnego commita.');
  process.exitCode = error?.status ?? 1;
}

if (!process.exitCode) {
  console.log(`Paczka marketplace: ${archivePath}`);
  console.log('Paczka zawiera wyłącznie pliki zapisane w aktualnym commicie.');
}
