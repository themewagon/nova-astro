import * as cheerio from 'cheerio';

export interface ImageIssue {
  file: string;
  rule: string;
  message: string;
}

const VALID_LOADING = new Set(['lazy', 'eager']);

export function auditRenderedImages(html: string, file: string): ImageIssue[] {
  const $ = cheerio.load(html);
  const issues: ImageIssue[] = [];

  $('img').each((_, element) => {
    const image = $(element);
    if (image.attr('id') === 'ui-lightbox-img') return;

    const alt = image.attr('alt')?.trim();
    const decorative = image.attr('aria-hidden') === 'true';
    const width = Number(image.attr('width'));
    const height = Number(image.attr('height'));
    const loading = image.attr('loading');

    if (!alt && !decorative) issues.push({ file, rule: 'image-alt', message: 'Image must have a non-empty alt attribute.' });
    if (!Number.isFinite(width) || width <= 0) {
      issues.push({ file, rule: 'image-width', message: 'Image must have a positive numeric width attribute.' });
    }
    if (!Number.isFinite(height) || height <= 0) {
      issues.push({ file, rule: 'image-height', message: 'Image must have a positive numeric height attribute.' });
    }
    if (!loading || !VALID_LOADING.has(loading)) {
      issues.push({ file, rule: 'image-loading', message: 'Image must define loading="lazy" or loading="eager".' });
    }

    const style = image.attr('style') ?? '';
    if (!style.includes('aspect-ratio') && (!Number.isFinite(width) || !Number.isFinite(height))) {
      issues.push({ file, rule: 'image-ratio', message: 'Image must define dimensions or an aspect-ratio fallback.' });
    }
  });

  return issues;
}

export function auditSmartImageFallback(source: string, file: string): ImageIssue[] {
  const requiredMarkers = ['showPlaceholder', '!src', 'isResolved', 'aspect-video'];
  return requiredMarkers
    .filter((marker) => !source.includes(marker))
    .map((marker) => ({
      file,
      rule: 'image-fallback',
      message: `SmartImage fallback is missing marker "${marker}".`,
    }));
}
