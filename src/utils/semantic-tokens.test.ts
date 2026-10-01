import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const requiredColors = [
  'success',
  'on-success',
  'success-container',
  'on-success-container',
  'warning',
  'on-warning',
  'warning-container',
  'on-warning-container',
  'info',
  'on-info',
  'info-container',
  'on-info-container',
];

describe('Semantic design tokens', () => {
  const stylesPath = path.join(process.cwd(), 'src/styles/themes.css');
  const tailwindPath = path.join(process.cwd(), 'src/styles/tailwind-theme.css');
  const styles = fs.readFileSync(stylesPath, 'utf8');
  const tailwindTheme = fs.readFileSync(tailwindPath, 'utf8');

  it('defines every semantic color in the Nova profile', () => {
    const themeBlocks = styles
      .split(/(?=\[data-theme=|:root\s*\{)/)
      .filter((block) => {
        const trimmed = block.trimStart();
        return trimmed.startsWith(':root') || trimmed.startsWith('[data-theme');
      });

    expect(themeBlocks.length).toBe(1);

    for (const block of themeBlocks) {
      for (const color of requiredColors) {
        expect(block, `Brak tokenu --color-${color} w jednym z motywów`).toContain(
          `--color-${color}:`,
        );
      }
    }
  });

  it('exposes semantic colors to Tailwind utilities', () => {
    for (const color of requiredColors) {
      expect(tailwindTheme).toContain(`--color-${color}: var(--color-${color});`);
    }
  });
});
