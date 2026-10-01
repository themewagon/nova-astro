import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Test integralnosci systemu projektowego.
 * Sprawdza czy kolory zdefiniowane w themes.css spelniaja normy kontrastu WCAG.
 */

// Pomocnicza funkcja do obliczania luminancji
function getLuminance(hex: string): number {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  [r, g, b] = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrast(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe('Design Tokens Accessibility', () => {
  const themesPath = path.join(process.cwd(), 'src/styles/themes.css');
  const cssContent = fs.readFileSync(themesPath, 'utf8');

  // Prosty parser dla zmiennych CSS (wyciaga hex)
  function getVarValue(varName: string): string | null {
    const regex = new RegExp(`${varName}:\\s*(#[0-9a-fA-F]{6})`, 'i');
    const match = cssContent.match(regex);
    return match ? match[1] : null;
  }

  it('Light Theme: Contrast should be valid (AA standard > 4.5)', () => {
    const text = getVarValue('--ui-text-on-light');
    const bg = getVarValue('--color-brand-light');

    if (text && bg) {
      const contrast = getContrast(text, bg);
      expect(contrast, `Kontrast ${text} na ${bg} wynosi ${contrast.toFixed(2)} - powinien być > 4.5`).toBeGreaterThan(4.5);
    }
  });

  it('Dark Theme: Contrast should be valid (AA standard > 4.5)', () => {
    const text = getVarValue('--ui-text-on-dark');
    const bg = getVarValue('--color-brand-dark');

    if (text && bg) {
      const contrast = getContrast(text, bg);
      expect(contrast, `Kontrast ${text} na ${bg} wynosi ${contrast.toFixed(2)} - powinien być > 4.5`).toBeGreaterThan(4.5);
    }
  });

  it('Primary Brand Color should be clearly visible on light background', () => {
    const primary = getVarValue('--color-brand-primary');
    const bg = getVarValue('--color-brand-light');

    if (primary && bg) {
      const contrast = getContrast(primary, bg);
      expect(contrast, `Kontrast koloru marki ${primary} na ${bg} wynosi ${contrast.toFixed(2)}`).toBeGreaterThan(3.0); // Dla duzego tekstu/UI 3.0 wystarczy
    }
  });
});
