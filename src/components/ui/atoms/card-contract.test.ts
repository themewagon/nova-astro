import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const stylesDir = resolve(__dirname, '../../../styles');
const componentsCss = readFileSync(join(stylesDir, 'components.css'), 'utf-8');
const motionCss = readFileSync(join(stylesDir, 'motion.css'), 'utf-8');

describe('ui-card-interactive — kontrakt CSS', () => {
  it('kontrakt istnieje w components.css (transition 250ms, easing easeOutCubic)', () => {
    expect(componentsCss).toContain('.ui-card-interactive');
    // Contract: 250ms and joint easeOutCubic easing (soft start = smooth flow,
    // agresywny expo-out przy 200ms wygladal jak skok)
    expect(componentsCss).toMatch(/\.ui-card-interactive\s*\{[^}]*250ms cubic-bezier\(0\.33, 1, 0\.68, 1\)/s);
  });

  it('hover lift idzie przez transform, nie translate (kolizja z reveal w motion.css)', () => {
    const hoverBlock = componentsCss.match(/\.ui-card-interactive:hover\s*\{[^}]*\}/g) || [];
    const lift = hoverBlock.find((b) => b.includes('translateY(-0.25rem)'));
    expect(lift).toBeDefined();
    expect(lift).not.toContain('translate:');
  });

  it('hover zmienia border (brand-primary 34%) i shadow (brand-dark 12%)', () => {
    const hoverBlock = componentsCss.match(/\.ui-card-interactive:hover\s*\{[^}]*\}/g) || [];
    const style = hoverBlock.find((b) => b.includes('translateY(-0.25rem)'));
    expect(style).toContain('color-mix(in oklch, var(--color-brand-primary) 34%, var(--color-outline))');
    expect(style).toContain('0 1.625rem 4rem color-mix(in oklch, var(--color-brand-dark) 12%, transparent)');
  });

  it('hover jest strzeżony media (hover: hover) — brak liftu na dotyku', () => {
    expect(componentsCss).toMatch(/@media \(hover: hover\)\s*\{[^@]*\.ui-card-interactive:hover/s);
  });

  it('hover border/shadow jest UNLAYERED (selektor z html) — reguła w @layer przegrywa z utility border-*/shadow-* z warstwy utilities', () => {
    const unlayered = componentsCss.match(/@media \(hover: hover\)\s*\{\s*html \.ui-card-interactive:hover\s*\{[^}]*\}/);
    expect(unlayered).not.toBeNull();
    expect(unlayered![0]).toContain('color-mix(in oklch, var(--color-brand-primary) 34%, var(--color-outline))');
    expect(unlayered![0]).toContain('0 1.625rem 4rem color-mix(in oklch, var(--color-brand-dark) 12%, transparent)');
  });

  it('reduced-motion wyłącza transition i hover lift', () => {
    const reduced = componentsCss.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n  \}/g) || [];
    const cardBlock = reduced.find((b) => b.includes('.ui-card-interactive'));
    expect(cardBlock).toBeDefined();
    expect(cardBlock).toContain('transition: none');
    expect(cardBlock).toContain('transform: none');
  });

  it('motion.css ma interplay: widoczna karta wraca do transition 250ms', () => {
    expect(motionCss).toContain('html[data-motion-ready] .ui-card-interactive[data-motion-visible]');
    // The input (opacity/filter/translate) remains from motion tokens...
    expect(motionCss).toMatch(/\.ui-card-interactive\[data-motion-visible\]\s*\{[^}]*opacity var\(--motion-duration\)/s);
    // ...a hover (transform/shadow/border) animates with a 250ms contract
    expect(motionCss).toMatch(/\.ui-card-interactive\[data-motion-visible\]\s*\{[^}]*transform 250ms cubic-bezier\(0\.33, 1, 0\.68, 1\) 0ms/s);
  });

  it('motion.css ma reduced-motion override dla interplay (unlayered nie moze go nadpisac)', () => {
    const reduced = motionCss.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g) || [];
    const interplay = reduced.find((b) => b.includes('.ui-card-interactive[data-motion-visible]'));
    expect(interplay).toBeDefined();
    expect(interplay).toContain('transition: none !important');
  });
});

describe('ui-card-interactive — kontrakt użycia (registry, molecules, pages)', () => {
  const srcDir = resolve(__dirname, '../../..');
  // We scan all places where cards may be created: registers (organisms),
  // molecules (card molecules) and pages (cards written directly in pages, e.g. blog).
  const scanDirs = ['components/registry', 'components/ui/molecules', 'pages'].map((d) => join(srcDir, d));
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.astro')) files.push(full);
    }
  };
  scanDirs.forEach(walk);

  it('blok z kontraktem nie niesie wlasnego hover lift/shadow na tym samym elemencie', () => {
    const violations: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf-8');
      // Atrybut class (i class:list) zawierajacy ui-card-interactive w jednej linii
      // z hover:-translate-y lub hover:shadow znaczy, ze stary hover zostal na karcie.
      const lines = source.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('ui-card-interactive') && /hover:-translate-y|hover:shadow-/.test(line)) {
          violations.push(`${file}:${i + 1}`);
        }
      });
    }
    expect(violations).toEqual([]);
  });
});
