import { describe, it, expect, beforeAll } from 'vitest';
import * as cheerio from 'cheerio';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AudienceSplitBlock from '@components/registry/about/AudienceSplitBlock.astro';

// Dlaczego: test kontraktowy renderuje PRAWDZIWY komponent Astro przez
// experimental_AstroContainer(renderToString from astro) and checks the structure
// HTML by cheerio. Pattern: services-media-cards-contract.test.ts which
// passed launch verification (16/16 tests). Thanks to this, it detects
// regresje w renderowaniu bez uruchamiania pelnego builda.

interface Group {
  title: string;
  description: string;
}

interface DataOverrides {
  pl?: {
    eyebrow?: string;
    heading?: string;
    description?: string;
    groups?: Group[];
  };
}

let container: AstroContainer;

async function renderBlock(props: Record<string, unknown> = {}): Promise<string> {
  return container.renderToString(AudienceSplitBlock, { props });
}

describe('AudienceSplitBlock, kontrakt renderowania', () => {
  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it('renderuje <section> z ui-section, tone page, id i borderem', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('section').length).toBe(1);
    expect($('section').hasClass('ui-section')).toBe(true);
    expect($('section').hasClass('ui-bg-page')).toBe(true);
    expect($('section').attr('id')).toBe('dla-kogo');
    expect($('section').hasClass('border-t')).toBe(true);
    expect($('section').hasClass('border-brand-dark/10')).toBe(true);
  });

  it('zawiera .ui-container', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('.ui-container').length).toBe(1);
  });

  describe('grid', () => {
    it('grid ma 2 kolumny w proporcji 1fr / 1.2fr na desktopie', async () => {
      const $ = cheerio.load(await renderBlock());
      const grid = $('.grid');
      expect(grid.hasClass('lg:grid-cols-[1fr_1.2fr]')).toBe(true);
    });

    it('grid jest mobile-first (gap-10, lg:gap-14) i wyśrodkowany w pionie', async () => {
      const $ = cheerio.load(await renderBlock());
      const grid = $('.grid');
      expect(grid.hasClass('gap-10')).toBe(true);
      expect(grid.hasClass('lg:gap-14')).toBe(true);
      expect(grid.hasClass('items-center')).toBe(true);
    });
  });

  describe('lewa kolumna (tekst)', () => {
    it('renderuje accent-label, dokładnie jeden h2 i lead', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.ui-type-accent-label').text()).toContain('Dla kogo pracujemy');
      expect($('h2').length).toBe(1);
      expect($('h2').text()).toContain('Pomagamy firmom');
      expect($('.ui-type-lead').text()).toContain('przepływ pracy');
    });

    it('lewa kolumna jest wyśrodkowana na mobile, do lewej na desktopie', async () => {
      const $ = cheerio.load(await renderBlock());
      const col = $('.grid').children().first();
      expect(col.hasClass('text-center')).toBe(true);
      expect(col.hasClass('lg:text-left')).toBe(true);
    });
  });

  describe('prawa kolumna (grupy)', () => {
    it('renderuje dokładnie 4 grupy z h3 (tytuł) i opisem', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('h3').length).toBe(4);
      const titles = ['Producenci', 'Dystrybutorzy', 'Firmy usługowe', 'Startupy'];
      $('h3').each((i, el) => {
        expect($(el).text()).toContain(titles[i]);
      });
      expect($('.ui-type-text-feature-sm').length).toBe(4);
    });

    it('renderuje 3 separatory h-px między 4 grupami, z tokenem bg-brand-dark/10', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.h-px').length).toBe(3);
      $('.h-px').each((_, el) => {
        expect($(el).hasClass('bg-brand-dark/10')).toBe(true);
        expect($(el).hasClass('max-w-[200px]')).toBe(true);
        expect($(el).hasClass('lg:max-w-none')).toBe(true);
      });
    });

    it('separatory stoją między grupami, nie po ostatniej', async () => {
      const $ = cheerio.load(await renderBlock());
      const items = $('.h-px').parent().children();
      // 4 grupy + 3 separatory = 7 dzieci
      expect(items.length).toBe(7);
      expect(items.last().hasClass('h-px')).toBe(false);
    });
  });

  describe('i18n (pl/en)', () => {
    it('EN renderuje angielski eyebrow, nagłówek i grupy', async () => {
      const $ = cheerio.load(await renderBlock({ locale: 'en' }));
      expect($('.ui-type-accent-label').text()).toContain('Who we work with');
      expect($('h2').text()).toContain('We help companies');
      expect($('h3').first().text()).toContain('Manufacturers');
      expect($('.ui-type-text-feature-sm').first().text()).toContain('cut losses');
    });

    it('props data nadpisuje domyślny JSON (wzorzec "props || json")', async () => {
      const overrides: DataOverrides = {
        pl: {
          eyebrow: 'Testowy eyebrow',
          heading: 'Testowy nagłówek',
          groups: [{ title: 'Tylko jedna', description: 'Opis testowy' }],
        },
      };
      const $ = cheerio.load(await renderBlock({ data: overrides }));
      expect($('h2').text()).toContain('Testowy nagłówek');
      expect($('.ui-type-accent-label').text()).toContain('Testowy eyebrow');
      expect($('h3').length).toBe(1);
      // 1 group = 0 separators
      expect($('.h-px').length).toBe(0);
    });
  });

  it('nie zawiera danych projektu źródłowego', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('client-specific');
    expect(html).not.toContain('Magazyn i logistyka');
    expect(html).not.toContain('Kadra zarządzająca');
  });

  it('nie zawiera systemu data-reveal ani klienckich tokenów CSS', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('data-reveal');
    expect(html).not.toContain('border-outline');
    expect(html).not.toContain('bg-outline');
    expect(html).not.toContain('text-on-surface-variant');
  });
});
