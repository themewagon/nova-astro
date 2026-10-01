import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const assetDirectory = path.join(process.cwd(), 'public', 'assets', 'decorations', 'svg');

describe('SVG decoration asset contract', () => {
  it('contains all imported shape assets', () => {
    const assets = fs.readdirSync(assetDirectory).filter((file) => file.endsWith('.svg'));
    expect(assets).toHaveLength(72);
    expect(assets).toContain('shape-01.svg');
    expect(assets).toContain('shape-72.svg');
  });

  it('keeps decorative SVGs square and self-contained', () => {
    const assets = fs.readdirSync(assetDirectory).filter((file) => file.endsWith('.svg'));
    assets.forEach((asset) => {
      const source = fs.readFileSync(path.join(assetDirectory, asset), 'utf8');
      expect(source).toMatch(/<svg[^>]+width="256"[^>]+height="256"/);
      expect(source).not.toContain('<script');
      expect(source).not.toContain('<script');
      expect(source).not.toContain('href="http');
    });
  });
});
