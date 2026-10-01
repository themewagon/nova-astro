import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, '../../public/js/lenis.js'),
  'utf8',
);
const navbarSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '../../public/js/navbar.js'),
  'utf8',
);

describe('Lenis scroll contract', () => {
  it('uses one Lenis instance lifecycle instead of duplicate initialization', () => {
    expect(source.match(/new Lenis\(/g)).toHaveLength(1);
    expect(source).toContain('destroyLenis();');
    expect(source).toContain('currentLenis = createLenis();');
  });

  it('keeps scroll ownership in Lenis instead of resetting from navbar', () => {
    expect(source).toContain("history.pushState(null, '', link.href)");
    expect(source).toContain("history.scrollRestoration");
    expect(source).toContain("window.scrollTo({ top: 0, left: 0, behavior: 'instant' });");
    expect(navbarSource).not.toContain('history.scrollRestoration');
    expect(navbarSource).not.toContain('window.scrollTo(');
  });

  it('handles same-document hashes without intercepting cross-page links', () => {
    expect(source).toContain("url.pathname !== window.location.pathname");
    expect(source).toContain('getSameDocumentHash');
    expect(source).toContain("history.pushState(null, '', link.href)");
  });

  it('restores anchors after Astro navigation without timeout polling', () => {
    expect(source).toContain("document.addEventListener('astro:after-swap'");
    expect(source).toContain('function scheduleAnchorScroll()');
    expect(source).toContain('scheduleAnchorScroll();');
    expect(source).toContain('requestAnimationFrame(function()');
    expect(source).not.toContain('setTimeout(');
  });

  it('respects reduced motion for anchor navigation', () => {
    expect(source).toContain("prefers-reduced-motion: reduce");
    expect(source).toContain('immediate: immediate || isReducedMotion');
  });

  it('does not boot Lenis when reduced motion is requested', () => {
    expect(source).toContain('if (isReducedMotion) return;');
    expect(source.indexOf('if (isReducedMotion) return;')).toBeLessThan(
      source.indexOf('currentLenis = createLenis();'),
    );
  });
});
