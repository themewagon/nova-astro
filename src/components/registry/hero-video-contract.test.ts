import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { formatInternalLink } from '@utils/url';

// Why: the contract test builds HTML manually (hero-contract.test.ts pattern),
// because rendering .astro in vitest would require additional runtime. The test keeps an eye on it
// agreements between the HeroVideoBlock component and CMS/JSON: video attributes, poster,
// deferred loading (data-src + preload="none") i wariant grayscale.
interface VideoHeroData {
  tagline?: string;
  title: string;
  subtitle?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  trustItems?: { text: string }[];
  video?: { sources: string[]; poster?: string; grayscale?: boolean };
  headingTag?: string;
}

function renderVideoHeroHtml(data: VideoHeroData): string {
  const taglineHtml = data.tagline
    ? `<p class="ui-type-accent-label mb-4 text-white/70">${data.tagline}</p>`
    : '';

  const headingTag = data.headingTag || 'h1';
  const headingHtml = `<${headingTag} class="ui-type-heading-hero font-heading font-bold text-white">${data.title}</${headingTag}>`;

  const subtitleHtml = data.subtitle
    ? `<p class="ui-type-lead text-white/80">${data.subtitle}</p>`
    : '';

  const ctaHtml = data.primaryCta
    ? `<a href="${formatInternalLink(data.primaryCta.href)}" class="ui-button ui-button-primary">${data.primaryCta.label}</a>`
    : '';
  const secondaryCtaHtml = data.secondaryCta
    ? `<a href="${formatInternalLink(data.secondaryCta.href)}" class="ui-button ui-button-outline">${data.secondaryCta.label}</a>`
    : '';

  const trustHtml = data.trustItems && data.trustItems.length > 0
    ? `<ul>${data.trustItems.map((item) => `<li>${item.text}</li>`).join('')}</ul>`
    : '';

  const posterMobileHtml = data.video?.poster
    ? `<img id="hero-video-poster-mobile" src="${data.video.poster}" alt="" />`
    : '';

  const videoSourcesHtml = data.video?.sources
    ? data.video.sources.map((src) => `<source data-src="${src}" />`).join('')
    : '';

  const grayscaleClass = data.video?.grayscale ? ' grayscale' : '';
  const grayscaleStyle = data.video?.grayscale ? ' style="filter: grayscale(1);"' : '';

  const videoHtml = data.video
    ? `<video id="hero-video-media" class="absolute inset-0 size-full object-cover${grayscaleClass}" autoplay muted loop playsinline preload="none" poster="${data.video.poster || ''}" data-hero-video${grayscaleStyle}>${videoSourcesHtml}</video>`
    : '';

  return `<section class="ui-section ui-bg-page">
    <div class="absolute inset-0" aria-hidden="true">
      ${posterMobileHtml}
      ${videoHtml}
      <div class="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>
    </div>
    <div class="ui-container">
      ${taglineHtml}
      ${headingHtml}
      ${subtitleHtml}
      <div>${ctaHtml}${secondaryCtaHtml}</div>
      ${trustHtml}
    </div>
  </section>`;
}

describe('HeroVideoBlock — kontrakt renderowania', () => {
  const defaultData: VideoHeroData = {
    tagline: 'Wideo w tle',
    title: 'Twój przekaz w ruchu',
    subtitle: 'Deferred loading oszczędza transfer.',
    primaryCta: { label: 'Bezpłatna wycena', href: '/kontakt/' },
    secondaryCta: { label: 'Zobacz realizacje', href: '/#realizacje' },
    trustItems: [{ text: 'Szybkie ładowanie' }, { text: 'Oszczędność transferu' }],
    video: {
      sources: ['/assets/videos/hero.mp4', '/assets/videos/hero.webm'],
      poster: '/assets/images/hero-poster.webp',
      grayscale: false,
    },
  };

  it('renderuje <section> z ui-section', () => {
    const $ = cheerio.load(renderVideoHeroHtml(defaultData));
    expect($('section').length).toBe(1);
    expect($('section').hasClass('ui-section')).toBe(true);
  });

  it('renderuje tytuł w nagłówku (domyślnie h1)', () => {
    const $ = cheerio.load(renderVideoHeroHtml(defaultData));
    expect($('h1').text()).toContain('Twój przekaz');
  });

  it('respektuje headingTag (h2 zamiast h1)', () => {
    const $ = cheerio.load(renderVideoHeroHtml({ ...defaultData, headingTag: 'h2' }));
    expect($('h2').length).toBe(1);
    expect($('h1').length).toBe(0);
  });

  it('renderuje tagline jako accent-label gdy podany', () => {
    const $ = cheerio.load(renderVideoHeroHtml(defaultData));
    expect($('.ui-type-accent-label').text()).toBe('Wideo w tle');
  });

  describe('CTA', () => {
    it('renderuje przycisk CTA jako link z formatInternalLink (trailing slash)', () => {
      const $ = cheerio.load(renderVideoHeroHtml(defaultData));
      expect($('a.ui-button-primary').attr('href')).toBe('/kontakt/');
    });

    it('CTA zachowuje zewnętrzne URL', () => {
      const $ = cheerio.load(renderVideoHeroHtml({
        ...defaultData,
        primaryCta: { label: 'Zobacz', href: 'https://example.com/strona' },
      }));
      expect($('a.ui-button-primary').attr('href')).toBe('https://example.com/strona');
    });

    it('CTA nie ma href="#"', () => {
      const html = renderVideoHeroHtml(defaultData);
      expect(html).not.toContain('href="#"');
    });
  });

  describe('wideo w tle', () => {
    it('wideo ma atrybuty autoplay, muted, loop i playsinline', () => {
      const $ = cheerio.load(renderVideoHeroHtml(defaultData));
      const video = $('video');
      expect(video.attr('autoplay')).toBeDefined();
      expect(video.attr('muted')).toBeDefined();
      expect(video.attr('loop')).toBeDefined();
      expect(video.attr('playsinline')).toBeDefined();
    });

    it('wideo ma preload="none" i źródła w data-src (deferred loading)', () => {
      const $ = cheerio.load(renderVideoHeroHtml(defaultData));
      const video = $('video');
      expect(video.attr('preload')).toBe('none');
      expect(video.attr('src')).toBeUndefined();
      expect($('video source[data-src]').length).toBe(2);
      expect(video.find('source[src]').length).toBe(0);
    });

    it('poster jest ustawiony na wideo i jako obraz dla mobile', () => {
      const $ = cheerio.load(renderVideoHeroHtml(defaultData));
      expect($('video').attr('poster')).toBe('/assets/images/hero-poster.webp');
      expect($('#hero-video-poster-mobile').attr('src')).toBe('/assets/images/hero-poster.webp');
    });

    it('brak wideo w propsach nie renderuje elementu <video>', () => {
      const $ = cheerio.load(renderVideoHeroHtml({ title: 'Bez wideo' }));
      expect($('video').length).toBe(0);
    });

    it('brak posteru nie renderuje obrazu mobile', () => {
      const $ = cheerio.load(renderVideoHeroHtml({
        ...defaultData,
        video: { sources: ['/assets/videos/hero.mp4'] },
      }));
      expect($('#hero-video-poster-mobile').length).toBe(0);
    });
  });

  describe('grayscale', () => {
    it('dodaje klasę filter (grayscale), gdy prop grayscale=true', () => {
      const $ = cheerio.load(renderVideoHeroHtml({
        ...defaultData,
        video: { ...defaultData.video!, grayscale: true },
      }));
      const video = $('video');
      expect(video.hasClass('grayscale')).toBe(true);
      expect(video.attr('style')).toContain('filter: grayscale(1)');
    });

    it('nie dodaje klasy grayscale, gdy prop grayscale=false', () => {
      const $ = cheerio.load(renderVideoHeroHtml(defaultData));
      expect($('video').hasClass('grayscale')).toBe(false);
    });
  });

  describe('trust items', () => {
    it('renderuje pasek zaufania tylko gdy są elementy', () => {
      const $ = cheerio.load(renderVideoHeroHtml(defaultData));
      expect($('ul li').length).toBe(2);
      expect($('ul li').first().text()).toBe('Szybkie ładowanie');
    });

    it('pomija pasek zaufania, gdy lista jest pusta', () => {
      const $ = cheerio.load(renderVideoHeroHtml({ ...defaultData, trustItems: [] }));
      expect($('ul').length).toBe(0);
    });
  });
});
