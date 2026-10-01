import { describe, it, expect, beforeAll } from 'vitest';
import * as cheerio from 'cheerio';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import LogoGridBlock from '@components/registry/about/LogoGridBlock.astro';

// Dlaczego: test kontraktowy renderuje PRAWDZIWY komponent Astro przez
// experimental_AstroContainer (wzorzec services-media-cards-contract.test.ts)
// and checks the HTML structure through cheerio. Thanks to this, it detects regressions in
// rendering without running a full build, and expectations reflect
// the actual output of the component, not a hand-built string. LogoGridBlock is
// a copy of the "LOGOTYPES" section: STATIC grid of logos
// (2 / 3 / 5 kolumn), a nie karuzela jak MarqueeBlock czy TrustBarBlock.

const PLACEHOLDER_SRC = '/assets/placeholders/logo-placeholder.svg';

const PL_DATA = {
  heading: 'Zaufali nam',
  description: 'Firmy i marki, które nam zaufały przy realizacji swoich projektów',
  items: Array.from({ length: 10 }, (_, i) => ({
    src: PLACEHOLDER_SRC,
    alt: `Firma ${i + 1}`,
  })),
};

const EN_DATA = {
  heading: 'Trusted by',
  description: 'Companies and brands that trusted us with their projects',
  items: Array.from({ length: 10 }, (_, i) => ({
    src: PLACEHOLDER_SRC,
    alt: `Company ${i + 1}`,
  })),
};

let container: AstroContainer;

async function renderBlock(props: Record<string, unknown> = {}): Promise<string> {
  return container.renderToString(LogoGridBlock, { props });
}

describe('LogoGridBlock, kontrakt renderowania', () => {
  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it('renderuje <section> z ui-section, tone page i górnym borderem', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('section').length).toBe(1);
    expect($('section').hasClass('ui-section')).toBe(true);
    expect($('section').hasClass('ui-bg-page')).toBe(true);
    expect($('section').hasClass('border-t')).toBe(true);
    expect($('section').hasClass('border-brand-dark/10')).toBe(true);
  });

  it('zawiera .ui-container', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('.ui-container').length).toBe(1);
  });

  describe('nagłówek', () => {
    it('renderuje dokładnie jeden h2 z nagłówkiem', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('h2').length).toBe(1);
      expect($('h2').text()).toContain('Zaufali nam');
    });

    it('nagłówek i lead są wyśrodkowane (text-center na h2 i na rodzicu lead)', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('h2').hasClass('text-center')).toBe(true);
      // Dlaczego: lead dziedziczy text-center z rodzica .mx-auto.max-w-4xl.
      expect($('.ui-type-lead').parent().hasClass('text-center')).toBe(true);
    });

    it('lead ma ograniczoną szerokość (max-w-2xl)', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.ui-type-lead').hasClass('max-w-2xl')).toBe(true);
    });
  });

  describe('grid', () => {
    it('grid ma 2 kolumny na mobile, 3 na md i 5 na lg', async () => {
      const $ = cheerio.load(await renderBlock());
      const grid = $('.grid');
      expect(grid.hasClass('grid-cols-2')).toBe(true);
      expect(grid.hasClass('md:grid-cols-3')).toBe(true);
      expect(grid.hasClass('lg:grid-cols-5')).toBe(true);
    });

    it('grid jest mobile-first z pionowaniem elementów i odstępami jak w oryginale', async () => {
      const $ = cheerio.load(await renderBlock());
      const grid = $('.grid');
      expect(grid.hasClass('mt-14')).toBe(true);
      expect(grid.hasClass('items-center')).toBe(true);
      expect(grid.hasClass('gap-x-8')).toBe(true);
      expect(grid.hasClass('gap-y-12')).toBe(true);
    });
  });

  describe('logotypy', () => {
    it('renderuje co najmniej 10 obrazów z placeholderem biblioteki', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('img').length).toBeGreaterThanOrEqual(10);
      $('img').each((_, el) => {
        expect($(el).attr('src')).toBe(PLACEHOLDER_SRC);
      });
    });

    it('każdy logotyp ma klasę grayscale i wygaszenie (opacity-40)', async () => {
      const $ = cheerio.load(await renderBlock());
      $('img').each((_, el) => {
        expect($(el).hasClass('grayscale')).toBe(true);
        expect($(el).hasClass('opacity-40')).toBe(true);
        expect($(el).hasClass('hover:grayscale-0')).toBe(true);
        expect($(el).hasClass('hover:opacity-80')).toBe(true);
        expect($(el).hasClass('max-h-12')).toBe(true);
        expect($(el).hasClass('object-contain')).toBe(true);
      });
    });

    it('każdy logotyp jest wyśrodkowany w swoim kontenerze', async () => {
      const $ = cheerio.load(await renderBlock());
      $('img').each((_, el) => {
        const wrap = $(el).parent();
        expect(wrap.hasClass('flex')).toBe(true);
        expect(wrap.hasClass('items-center')).toBe(true);
        expect(wrap.hasClass('justify-center')).toBe(true);
      });
    });
  });

  describe('brak śladów klienta', () => {
    it('nie zawiera data-reveal ani nazw marek klienta', async () => {
      const html = await renderBlock();
      expect(html).not.toContain('data-reveal');
      expect(html).not.toContain('budvar');
      expect(html).not.toContain('toyota');
      expect(html).not.toContain('mokate');
      expect(html).not.toContain('/client-specific/logos/');
    });
  });

  describe('i18n (pl/en)', () => {
    it('EN renderuje angielski nagłówek i alt-y', async () => {
      const $ = cheerio.load(await renderBlock({ locale: 'en' }));
      expect($('h2').text()).toContain('Trusted by');
      expect($('img').first().attr('alt')).toBe('Company 1');
    });

    it('liczba logotypów jest elastyczna (propsy nadpisują JSON)', async () => {
      const $ = cheerio.load(
        await renderBlock({
          data: {
            pl: { ...PL_DATA, items: [{ src: PLACEHOLDER_SRC, alt: 'Tylko jeden' }] },
            en: EN_DATA,
          },
        })
      );
      expect($('img').length).toBe(1);
    });
  });
});
