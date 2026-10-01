// Test kontraktowy bloku GalleryCrossfadeBlock, wzorowany na hero-contract.test.ts.
// It doesn't render the Astro component, only HTML according to its structure, so
// kontrakt (atrybuty data-*, preload, licznik) jest sprawdzany w izolacji.
import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';

interface GalleryImage {
  src: string;
  thumb: string;
  alt: string;
}

interface GalleryData {
  tagline?: string;
  title: string;
  description?: string;
  images: GalleryImage[];
}

function renderGalleryCrossfadeHtml(data: GalleryData): string {
  const firstThumbsPreload = data.images.slice(0, 6);

  const preloadHtml = firstThumbsPreload
    .map((image) => `<link rel="preload" as="image" href="${image.thumb}" />`)
    .join('');

  const totalCount = String(data.images.length).padStart(2, '0');

  const thumbHtml = data.images
    .map((image, index) => {
      const activeClass = index === 0
        ? 'border-brand-primary opacity-100'
        : 'border-transparent opacity-60 hover:opacity-100';
      return `
        <button type="button" data-thumb-button data-image-src="${image.src}" data-alt="${image.alt}" class="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 ${activeClass}" aria-label="${image.alt}">
          <img src="${image.thumb}" alt="" class="h-full w-full object-cover" loading="${index < 4 ? 'eager' : 'lazy'}" decoding="async" fetchpriority="${index < 4 ? 'high' : 'low'}" />
        </button>`;
    })
    .join('');

  return `
    <section class="ui-section ui-bg-page" id="galeria-crossfade">
      ${preloadHtml}
      <div class="ui-container">
        <div class="flex flex-col gap-6 text-center items-center mb-12 md:mb-16 mx-auto max-w-2xl">
          <h2>${data.title}</h2>
          <p>${data.description ?? ''}</p>
        </div>
        <div class="mt-12" data-gallery-crossfade>
          <div class="relative overflow-hidden rounded-2xl cursor-zoom-in" data-lightbox data-href="${data.images[0]?.src ?? ''}">
            <div class="relative">
              <div class="aspect-[16/10] lg:aspect-[20/9] overflow-hidden relative isolate" data-image-stage>
                <img data-image-prev alt="" class="absolute inset-0 h-full w-full object-cover opacity-0 z-10" />
                <img data-main-image src="${data.images[0]?.src ?? ''}" alt="${data.images[0]?.alt ?? ''}" class="absolute inset-0 h-full w-full object-cover" style="opacity: 1;" loading="eager" decoding="async" fetchpriority="high" />
              </div>
              <div class="absolute right-4 top-4 flex items-center gap-1.5 rounded-md bg-black/55 px-3 py-1 text-[13px] text-white/90">
                <span data-main-index>01</span>
                <span class="text-white/50">/</span>
                <span data-total-count>${totalCount}</span>
              </div>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">${thumbHtml}</div>
        </div>
      </div>
    </section>`;
}

describe('GalleryCrossfade — kontrakt renderowania', () => {
  const defaultData: GalleryData = {
    tagline: 'Nasze realizacje',
    title: 'Galeria',
    description: 'Wybrane realizacje z naszego portfolio.',
    images: [
      { src: '/assets/images/realizacja-1.webp', thumb: '/assets/image-derivatives/thumbs/realizacja-1.webp', alt: 'Realizacja 1' },
      { src: '/assets/images/realizacja-2.webp', thumb: '/assets/image-derivatives/thumbs/realizacja-2.webp', alt: 'Realizacja 2' },
      { src: '/assets/images/realizacja-3.webp', thumb: '/assets/image-derivatives/thumbs/realizacja-3.webp', alt: 'Realizacja 3' },
      { src: '/assets/images/realizacja-4.webp', thumb: '/assets/image-derivatives/thumbs/realizacja-4.webp', alt: 'Realizacja 4' },
      { src: '/assets/images/realizacja-5.webp', thumb: '/assets/image-derivatives/thumbs/realizacja-5.webp', alt: 'Realizacja 5' },
      { src: '/assets/images/realizacja-6.webp', thumb: '/assets/image-derivatives/thumbs/realizacja-6.webp', alt: 'Realizacja 6' },
    ],
  };

  it('renderuje tytuł sekcji', () => {
    const $ = cheerio.load(renderGalleryCrossfadeHtml(defaultData));
    expect($('h2').text()).toContain('Galeria');
  });

  it('renderuje licznik ze stanem pierwszego zdjęcia i całkowitą liczbą z padStart', () => {
    const $ = cheerio.load(renderGalleryCrossfadeHtml(defaultData));
    expect($('[data-main-index]').text()).toBe('01');
    expect($('[data-total-count]').text()).toBe('06');
  });

  it('pierwszy obraz główny ma loading="eager" i fetchpriority="high"', () => {
    const $ = cheerio.load(renderGalleryCrossfadeHtml(defaultData));
    const main = $('[data-main-image]');
    expect(main.attr('loading')).toBe('eager');
    expect(main.attr('fetchpriority')).toBe('high');
  });

  it('dodaje preload linki tylko dla pierwszych 6 miniaturek', () => {
    const $ = cheerio.load(renderGalleryCrossfadeHtml(defaultData));
    const preloads = $('link[rel="preload"][as="image"]');
    expect(preloads.length).toBe(6);
    expect(preloads.eq(0).attr('href')).toBe('/assets/image-derivatives/thumbs/realizacja-1.webp');
    expect(preloads.eq(5).attr('href')).toBe('/assets/image-derivatives/thumbs/realizacja-6.webp');
  });

  it('nie preloaduje więcej miniaturek niż jest zdjęć', () => {
    const data: GalleryData = {
      ...defaultData,
      images: defaultData.images.slice(0, 3),
    };
    const $ = cheerio.load(renderGalleryCrossfadeHtml(data));
    expect($('link[rel="preload"][as="image"]').length).toBe(3);
    expect($('[data-total-count]').text()).toBe('03');
  });

  it('renderuje miniaturki z data-thumb-button dla każdego zdjęcia', () => {
    const $ = cheerio.load(renderGalleryCrossfadeHtml(defaultData));
    expect($('[data-thumb-button]').length).toBe(6);
  });
});
