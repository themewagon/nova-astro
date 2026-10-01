import { describe, it, expect, beforeAll } from 'vitest';
import * as cheerio from 'cheerio';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import StepsNumberedBlock from '@components/registry/process/StepsNumberedBlock.astro';

// Dlaczego: test kontraktowy renderuje PRAWDZIWY komponent Astro przez
// experimental_AstroContainer(renderToString from astro) and checks the structure
// HTML by cheerio. Mirrors the "HOW WE DO" section of the project
// reference about page: centered header, grid of 3 steps with numbers
// in squares, dashed arrows between steps and a gradient line under the grid.
// Wzorzec: services-media-cards-contract.test.ts.

interface DataOverrides {
  pl?: {
    eyebrow?: string;
    headingLines?: string[];
    steps?: Array<{ num: string; title: string; description: string }>;
  };
}

let container: AstroContainer;

async function renderBlock(props: Record<string, unknown> = {}): Promise<string> {
  return container.renderToString(StepsNumberedBlock, { props });
}

describe('StepsNumberedBlock, kontrakt renderowania', () => {
  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it('renderuje <section> z ui-section, tone base i borderem', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('section').length).toBe(1);
    expect($('section').hasClass('ui-section')).toBe(true);
    expect($('section').hasClass('ui-bg-base')).toBe(true);
    expect($('section').hasClass('border-t')).toBe(true);
    expect($('section').hasClass('border-brand-dark/10')).toBe(true);
  });

  it('zawiera .ui-container', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('.ui-container').length).toBe(1);
  });

  describe('nagłówek sekcji', () => {
    it('renderuje eyebrow (accent-label) i dokładnie jeden h2', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.ui-type-accent-label').text()).toContain('Jak działamy');
      expect($('h2').length).toBe(1);
    });

    it('h2 składa się z dwóch linii rozdzielonych <br /> (headingLines z JSON)', async () => {
      const $ = cheerio.load(await renderBlock());
      const h2 = $('h2');
      expect(h2.html()).toContain('<br>');
      expect(h2.text()).toContain('Podejście, które przynosi');
      expect(h2.text()).toContain('mierzalne efekty');
    });

    it('h2 używa variantu section-heading-lg (clamp) i jest wyśrodkowany', async () => {
      const $ = cheerio.load(await renderBlock());
      const h2 = $('h2');
      expect(h2.hasClass('ui-type-heading-section-lg')).toBe(true);
      expect(h2.hasClass('!font-extrabold')).toBe(true);
      expect(h2.parent().hasClass('text-center')).toBe(true);
    });
  });

  describe('grid kroków', () => {
    it('grid jest mobile-first z 3 kolumnami na desktopie', async () => {
      const $ = cheerio.load(await renderBlock());
      const grid = $('.mt-14.grid');
      expect(grid.hasClass('gap-10')).toBe(true);
      expect(grid.hasClass('md:grid-cols-3')).toBe(true);
      expect(grid.hasClass('md:gap-6')).toBe(true);
    });

    it('renderuje dokładnie 3 artykuły kroków', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('article.relative.text-center').length).toBe(3);
    });
  });

  describe('numery kroków', () => {
    it('renderuje 3 numery w kwadratach bg-brand-primary (01, 02, 03)', async () => {
      const $ = cheerio.load(await renderBlock());
      const nums = $('article span.bg-brand-primary');
      expect(nums.length).toBe(3);
      expect(nums.eq(0).text()).toBe('01');
      expect(nums.eq(1).text()).toBe('02');
      expect(nums.eq(2).text()).toBe('03');
    });

    it('kwadrat numeru ma wymiary h-14 w-14, rounded-sm i biały tekst', async () => {
      const $ = cheerio.load(await renderBlock());
      const num = $('article span.bg-brand-primary').first();
      expect(num.hasClass('h-14')).toBe(true);
      expect(num.hasClass('w-14')).toBe(true);
      expect(num.hasClass('rounded-sm')).toBe(true);
      expect(num.hasClass('text-white')).toBe(true);
      expect(num.hasClass('text-xl')).toBe(true);
    });
  });

  describe('tytuły i opisy kroków', () => {
    it('każdy krok ma h3 z tytułem i opis', async () => {
      const $ = cheerio.load(await renderBlock());
      const titles = $('article h3');
      expect(titles.length).toBe(3);
      titles.each((_, el) => {
        expect($(el).hasClass('!text-lg')).toBe(true);
        expect($(el).hasClass('!font-extrabold')).toBe(true);
      });
      const bodies = $('article p');
      expect(bodies.length).toBe(3);
      bodies.each((_, el) => {
        expect($(el).hasClass('ui-type-body')).toBe(true);
        expect($(el).hasClass('!font-semibold')).toBe(true);
      });
      expect(titles.eq(0).text()).toContain('Diagnoza i cele');
      expect(bodies.eq(0).text()).toContain('Analizujemy potrzeby');
    });
  });

  describe('dashed strzałki między krokami', () => {
    it('renderuje 2 strzałki (kroki 1 i 2), nigdy po ostatnim kroku', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('[class*="border-dashed"]').length).toBe(2);
      const articles = $('article.relative.text-center');
      expect(articles.eq(0).find('[class*="border-dashed"]').length).toBe(1);
      expect(articles.eq(1).find('[class*="border-dashed"]').length).toBe(1);
      expect(articles.eq(2).find('[class*="border-dashed"]').length).toBe(0);
    });

    it('strzałka używa tokena border-brand-primary/40 i jest ukryta na mobile (hidden, md:flex)', async () => {
      const $ = cheerio.load(await renderBlock());
      const line = $('[class*="border-dashed"]');
      expect(line.hasClass('border-brand-primary/40')).toBe(true);
      const arrowWrap = line.first().parent();
      expect(arrowWrap.hasClass('hidden')).toBe(true);
      expect(arrowWrap.hasClass('md:flex')).toBe(true);
      expect(arrowWrap.hasClass('pointer-events-none')).toBe(true);
    });

    it('strzałka zawiera svg ze ścieżką m9 18 6-6-6-6', async () => {
      const $ = cheerio.load(await renderBlock());
      const arrowSvg = $('svg[stroke-width="3"]');
      expect(arrowSvg.length).toBe(2);
      expect(arrowSvg.first().find('path').attr('d')).toBe('m9 18 6-6-6-6');
    });
  });

  describe('linia gradientowa pod gridem', () => {
    it('renderuje dekoracyjną linię via-brand-dark/10 ukrytą na mobile', async () => {
      const $ = cheerio.load(await renderBlock());
      const line = $('.bg-gradient-to-r');
      expect(line.length).toBe(1);
      expect(line.hasClass('via-brand-dark/10')).toBe(true);
      expect(line.hasClass('w-full')).toBe(true);
      expect(line.hasClass('max-w-[720px]')).toBe(true);
      const wrap = line.parent();
      expect(wrap.hasClass('hidden')).toBe(true);
      expect(wrap.hasClass('md:flex')).toBe(true);
      expect(wrap.attr('aria-hidden')).toBe('true');
    });
  });

  describe('i18n (pl/en)', () => {
    it('EN renderuje angielski eyebrow, nagłówek i kroki', async () => {
      const $ = cheerio.load(await renderBlock({ locale: 'en' }));
      expect($('.ui-type-accent-label').text()).toContain('How we work');
      expect($('h2').text()).toContain('measurable results');
      expect($('article h3').first().text()).toContain('Diagnosis and goals');
    });

    it('props data nadpisuje domyślny JSON (wzorzec "props || json")', async () => {
      const overrides: DataOverrides = {
        pl: {
          eyebrow: 'Testowy eyebrow',
          headingLines: ['Linia pierwsza', 'Linia druga'],
          steps: [
            { num: '01', title: 'Krok testowy', description: 'Opis testowy' },
          ],
        },
      };
      const $ = cheerio.load(await renderBlock({ data: overrides }));
      expect($('.ui-type-accent-label').text()).toContain('Testowy eyebrow');
      expect($('h2').text()).toContain('Linia pierwsza');
      expect($('h2').text()).toContain('Linia druga');
      expect($('article.relative.text-center').length).toBe(1);
      expect($('article h3').text()).toContain('Krok testowy');
      // Why: one step does not generate any arrow, because arrow
      // only exists between steps (i < steps.length - 1).
      expect($('[class*="border-dashed"]').length).toBe(0);
    });
  });

  it('nie zawiera danych projektu ani systemu data-reveal', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('Wstępna analiza');
    expect(html).not.toContain('Wspólne projektowanie');
    expect(html).not.toContain('Budowanie kompetencji');
    expect(html).not.toContain('client-specific');
    expect(html).not.toContain('data-reveal');
  });

  it('nie zawiera klienckich tokenów CSS', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('border-outline');
    expect(html).not.toContain('via-outline');
    expect(html).not.toContain('text-on-surface-variant');
    expect(html).not.toContain('bg-brand-cream');
  });
});
