import { describe, it, expect, beforeAll } from 'vitest';
import * as cheerio from 'cheerio';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import HeroStatsBlock from '@components/registry/hero/HeroStatsBlock.astro';

// Dlaczego: test kontraktowy renderuje PRAWDZIWY komponent Astro przez
// experimental_AstroContainer(renderToString from astro) and checks the structure
// HTML by cheerio. Expectations reflect the HERO + STATS section from
// referencyjnej strony o-nas.astro: accent-label, h1 z clamp, lead
// and a statistics grid with dividing lines. Pattern: services-media-cards-contract.test.ts.

let container: AstroContainer;

async function renderBlock(props: Record<string, unknown> = {}): Promise<string> {
  return container.renderToString(HeroStatsBlock, { props });
}

describe('HeroStatsBlock, kontrakt renderowania', () => {
  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it('renderuje <section> z ui-section i tone page', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('section').length).toBe(1);
    expect($('section').hasClass('ui-section')).toBe(true);
    expect($('section').hasClass('ui-bg-page')).toBe(true);
  });

  it('zawiera dwa .ui-container (hero i stats) w jednej sekcji', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('section .ui-container').length).toBe(2);
  });

  describe('hero', () => {
    it('renderuje eyebrow jako accent-label w kolorze brand-primary', async () => {
      const $ = cheerio.load(await renderBlock());
      const label = $('.ui-type-accent-label');
      expect(label.length).toBe(1);
      expect(label.text()).toContain('O nas');
      expect(label.hasClass('text-brand-primary')).toBe(true);
    });

    it('renderuje dokładnie jeden h1', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('h1').length).toBe(1);
    });

    it('h1 używa clamp() z oryginału i jest w wyśrodkowanym wrapperze', async () => {
      const $ = cheerio.load(await renderBlock());
      const h1 = $('h1');
      expect(h1.hasClass('text-[clamp(2rem,5vw,3.5rem)]')).toBe(true);
      expect(h1.hasClass('leading-[1.08]')).toBe(true);
      expect(h1.parent().hasClass('text-center')).toBe(true);
    });

    it('renderuje opis jako lead w max-w-2xl', async () => {
      const $ = cheerio.load(await renderBlock());
      const lead = $('.ui-type-lead');
      expect(lead.length).toBe(1);
      expect(lead.hasClass('max-w-2xl')).toBe(true);
      expect(lead.text()).toContain('konkretne rezultaty');
    });
  });

  describe('statystyki', () => {
    it('renderuje dokładnie 3 statystyki z JSON', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.grid > div').length).toBe(3);
    });

    it('grid ma linie podziału: divide-y na mobile, sm:grid-cols-3 i sm:divide-x na desktopie', async () => {
      const $ = cheerio.load(await renderBlock());
      const grid = $('.grid');
      expect(grid.hasClass('divide-y')).toBe(true);
      expect(grid.hasClass('divide-brand-dark/10')).toBe(true);
      expect(grid.hasClass('sm:grid-cols-3')).toBe(true);
      expect(grid.hasClass('sm:divide-x')).toBe(true);
      expect(grid.hasClass('sm:divide-y-0')).toBe(true);
    });

    it('każda statystyka ma wartość (text-3xl, brand-primary) i label (text-sm, muted)', async () => {
      const $ = cheerio.load(await renderBlock());
      $('.grid > div').each((_, el) => {
        const paragraphs = $(el).children('p');
        expect(paragraphs.length).toBe(2);
        expect(paragraphs.first().hasClass('text-3xl')).toBe(true);
        expect(paragraphs.first().hasClass('font-extrabold')).toBe(true);
        expect(paragraphs.first().hasClass('text-brand-primary')).toBe(true);
        expect(paragraphs.last().hasClass('text-sm')).toBe(true);
        expect(paragraphs.last().hasClass('font-bold')).toBe(true);
        expect(paragraphs.last().hasClass('text-brand-dark/70')).toBe(true);
      });
    });

    it('statystyki używają ogólnych wartości 15+/100+/99%, bez danych klienta', async () => {
      const $ = cheerio.load(await renderBlock());
      const cells = $('.grid > div');
      expect(cells.first().text()).toContain('15+');
      expect(cells.first().text()).toContain('Lat doświadczenia');
      expect(cells.eq(1).text()).toContain('100+');
      expect(cells.eq(2).text()).toContain('99%');
    });
  });

  describe('i18n (pl/en)', () => {
    it('EN renderuje angielskie treści', async () => {
      const $ = cheerio.load(await renderBlock({ locale: 'en' }));
      expect($('.ui-type-accent-label').text()).toContain('About us');
      expect($('h1').text()).toContain('Numbers speak for themselves');
      expect($('.grid > div').first().text()).toContain('Years of experience');
    });

    it('props data nadpisuje JSON (liczba statystyk elastyczna)', async () => {
      const $ = cheerio.load(
        await renderBlock({
          data: {
            eyebrow: 'Test',
            heading: 'Własny tytuł',
            description: 'Własny opis',
            stats: [{ value: '1', label: 'Jeden' }],
          },
        })
      );
      expect($('h1').text()).toContain('Własny tytuł');
      expect($('.grid > div').length).toBe(1);
    });
  });

  it('nie zawiera klienckich tokenów, data-reveal ani danych klienta', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('data-reveal');
    expect(html).not.toContain('divide-outline');
    expect(html).not.toContain('text-on-surface-variant');
    expect(html).not.toContain('20+');
    expect(html).not.toContain('50+');
    expect(html).not.toContain('Lean Management w praktyce');
  });
});
