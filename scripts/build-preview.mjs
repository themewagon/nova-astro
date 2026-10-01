import { spawnSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Preview ma własny prefix, aby build nie mieszał ścieżek z głównym WebScale.
const result = spawnSync(npmCommand, ['run', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    PUBLIC_BASE_PATH: 'preview/nova',
    PUBLIC_SITE_URL: 'https://webscale.pl/preview/nova/',
  },
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
