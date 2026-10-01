import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const projectDir = path.resolve(import.meta.dirname, '../..');

function runQuick(mode: string, timeoutMs = 15_000): { code: number; output: string } {
  const script = path.resolve(projectDir, 'src/scripts/run-qa.ts');
  try {
    const output = execSync(`npx tsx "${script}" ${mode}`, {
      cwd: projectDir,
      encoding: 'utf8',
      timeout: timeoutMs,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, output };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return {
      code: e.status ?? 1,
      output: ((e.stdout || '') + (e.stderr || '')).trim(),
    };
  }
}

describe('run-qa orkiestrator', () => {
  it('buduje dist przed audytem linkow rendered HTML', () => {
    const source = fs.readFileSync(path.resolve(projectDir, 'src/scripts/run-qa.ts'), 'utf8');
    const buildIndex = source.indexOf("command: 'npm run build'");
    const linksIndex = source.indexOf("command: 'npm run check:links'");

    expect(buildIndex).toBeGreaterThan(-1);
    expect(linksIndex).toBeGreaterThan(-1);
    expect(buildIndex).toBeLessThan(linksIndex);
  });

  describe('qa:help', () => {
    it('wyswietla pomoc i zwraca kod 0', { timeout: 20_000 }, () => {
      const { code, output } = runQuick('help');
      expect(code).toBe(0);
      expect(output).toContain('Starter Kit');
      expect(output).toContain('npm run qa');
      expect(output).toContain('npm run qa:strict');
      expect(output).toContain('npm run qa:client');
    });
  });

  describe('nieznany tryb', () => {
    it('zwraca kod 1 z komunikatem', { timeout: 20_000 }, () => {
      const { code, output } = runQuick('nonexistent');
      expect(code).toBe(1);
      expect(output).toContain('Nieznany profil');
    });
  });

  describe('qa:client', () => {
    it('wykrywa placeholdery i zatrzymuje sie', { timeout: 90_000 }, () => {
      const { code, output } = runQuick('client', 60_000);
      expect(code).toBe(1);
      expect(output).toContain('placeholder');
      expect(output).toContain('NIE ZALICZONE');
    });
  });
});
