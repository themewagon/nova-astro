import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(resolve(root, file), 'utf8');

describe('kontrakt dekoracji', () => {
  it('utrzymuje izolowaną warstwę dekoracji bez wpływu na layout', () => {
    const source = read('src/components/decorations/DecorationLayer.astro');

    expect(source).toContain('pointer-events-none absolute inset-0');
    expect(source).toContain('aria-hidden="true"');
    expect(source).toContain('data-decoration-layer');
    expect(source).toContain("overflow?: 'hidden' | 'visible'");
  });

  it('buduje siatkę z tokenu koloru i wspiera wygaszanie krawędzi', () => {
    const source = read('src/components/decorations/GridPattern.astro');

    expect(source).toContain('data-decoration="grid-pattern"');
    expect(source).toContain('var(--decoration-grid-color)');
    expect(source).toContain('mask-image');
    expect(source).toContain('fade?: boolean');
  });

  it('utrzymuje dekoracje światła i linii jako elementy nieinteraktywne', () => {
    const spotlight = read('src/components/decorations/Spotlight.astro');
    const beams = read('src/components/decorations/BeamLines.astro');

    expect(spotlight).toContain('data-decoration="spotlight"');
    expect(spotlight).toContain('aria-hidden="true"');
    expect(beams).toContain('data-decoration="beam-lines"');
    expect(beams).toContain('repeating-linear-gradient');
    expect(beams).toContain('pointer-events-none absolute inset-0');
  });
});
