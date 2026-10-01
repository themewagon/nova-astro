import { describe, expect, it } from 'vitest';
import { auditRenderedImages, auditSmartImageFallback } from '@utils/image-audit';

describe('image audit', () => {
  it('accepts accessible images with dimensions and loading strategy', () => {
    expect(auditRenderedImages(
      '<img src="/hero.webp" alt="Hero" width="1200" height="630" loading="lazy">',
      'dist/index.html',
    )).toEqual([]);
  });

  it('detects missing image contract attributes', () => {
    const issues = auditRenderedImages('<img src="/hero.webp" alt="" loading="auto">', 'dist/index.html');
    expect(issues.map((issue) => issue.rule)).toEqual([
      'image-alt',
      'image-width',
      'image-height',
      'image-loading',
      'image-ratio',
    ]);
  });

  it('ignores the empty image reserved for the lightbox overlay', () => {
    expect(auditRenderedImages('<img id="ui-lightbox-img" src="" alt="Enlarged view">', 'dist/index.html')).toEqual([]);
  });

  it('accepts decorative images with an empty alt attribute', () => {
    expect(auditRenderedImages(
      '<img src="/texture.svg" alt="" aria-hidden="true" width="1600" height="900" loading="lazy">',
      'dist/index.html',
    )).toEqual([]);
  });

  it('requires SmartImage to keep a visible placeholder fallback', () => {
    expect(auditSmartImageFallback(
      'const showPlaceholder = placeholder || !src; const isResolved = !!resolvedImage; aspect-video',
      'SmartImage.astro',
    )).toEqual([]);
  });
});
