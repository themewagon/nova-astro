import { describe, it, expect, beforeAll } from 'vitest';
import * as cheerio from 'cheerio';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ServicesMediaCardsBlock from '@components/registry/services/ServicesMediaCardsBlock.astro';

// Dlaczego: test kontraktowy renderuje PRAWDZIWY komponent Astro przez
// experimental_AstroContainer(renderToString from astro) and checks the structure
// HTML by cheerio. This allows it to detect regressions in rendering without
// running a full build, and expectations reflect actual
// output of the component, not a hand-built string.

interface DataOverrides {
  pl?: {
    eyebrow?: string;
    heading?: string;
    description?: string;
    items?: Array<Record<string, unknown>>;
  };
}

const PLACEHOLDER_SRC = '/assets/placeholders/image-landscape.svg';

let container: AstroContainer;

async function renderBlock(props: Record<string, unknown> = {}): Promise<string> {
  return container.renderToString(ServicesMediaCardsBlock, { props });
}

describe('ServicesMediaCardsBlock, kontrakt renderowania', () => {
  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it('renderuje <section> z ui-section, tone page, id i borderem', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('section').length).toBe(1);
    expect($('section').hasClass('ui-section')).toBe(true);
    expect($('section').hasClass('ui-bg-page')).toBe(true);
    expect($('section').attr('id')).toBe('rozwiazania');
    expect($('section').hasClass('border-t')).toBe(true);
  });

  it('zawiera .ui-container', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('.ui-container').length).toBe(1);
  });

  describe('nagłówek sekcji', () => {
    it('renderuje eyebrow (accent-label), h2 i lead', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.ui-type-accent-label').text()).toContain('Obszary wsparcia');
      expect($('h2').length).toBe(1);
      expect($('h2').text()).toContain('Jak możemy pomóc');
      expect($('.ui-type-lead').text()).toContain('Każda organizacja ma inne wyzwania');
    });

    it('nagłówek jest wyśrodkowany (text-center)', async () => {
      const $ = cheerio.load(await renderBlock());
      const wrap = $('.text-center');
      expect(wrap.length).toBe(1);
      expect(wrap.hasClass('mx-auto')).toBe(true);
    });
  });

  describe('karty usług', () => {
    it('renderuje dokładnie 6 kart <article> z klasą lc-card-hover', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('article').length).toBe(6);
      $('article').each((_, el) => {
        expect($(el).hasClass('lc-card-hover')).toBe(true);
        expect($(el).hasClass('rounded-xl')).toBe(true);
        expect($(el).hasClass('shadow-soft')).toBe(true);
      });
    });

    it('karty mają alternujące tło (bg-white dla obrazu na górze, bg-brand-primary/10 dla obrazu na dole)', async () => {
      const $ = cheerio.load(await renderBlock());
      $('article').each((i, el) => {
        const expectedBg = i % 2 === 0 ? 'bg-white' : 'bg-brand-primary/10';
        expect($(el).hasClass(expectedBg)).toBe(true);
      });
    });

    it('każda karta ma h3 z tytułem i opisem', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('h3').length).toBe(6);
      const titles = ['Audyt procesów', 'Szkolenia zespołu', 'Wdrożenia zmian', 'Doradztwo', 'Outsourcing', 'Logistyka'];
      $('h3').each((i, el) => {
        expect($(el).text()).toContain(titles[i]);
      });
      expect($('.lc-card-body p').length).toBe(6);
    });

    it('każda karta ma link CTA z etykietą i kotwicą /#kontakt', async () => {
      const $ = cheerio.load(await renderBlock());
      const links = $('a.lc-arrow-link');
      expect(links.length).toBe(6);
      links.each((_, el) => {
        expect($(el).text()).toContain('Porozmawiajmy o tym');
        expect($(el).attr('href')).toBe('/#kontakt');
      });
    });

    it('link CTA ma ikonę strzałki w span.lc-arrow-link-icon', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.lc-arrow-link .lc-arrow-link-icon').length).toBe(6);
    });
  });

  describe('obrazy i naprzemienność', () => {
    it('renderuje 6 obrazków z placeholderem biblioteki', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('img').length).toBe(6);
      $('img').each((_, el) => {
        expect($(el).attr('src')).toBe(PLACEHOLDER_SRC);
        expect($(el).hasClass('aspect-[5/3]')).toBe(true);
      });
    });

    it('karty 1,3,5 mają obraz na górze (pierwsze dziecko), karty 2,4,6 na dole (ostatnie dziecko)', async () => {
      const $ = cheerio.load(await renderBlock());
      $('article').each((i, el) => {
        const first = $(el).children().first();
        const last = $(el).children().last();
        if (i % 2 === 0) {
          expect(first.hasClass('lc-card-img'), `karta ${i + 1} powinna mieć obraz na górze`).toBe(true);
          expect(last.hasClass('lc-card-body')).toBe(true);
        } else {
          expect(first.hasClass('lc-card-body'), `karta ${i + 1} powinna mieć treść na górze`).toBe(true);
          expect(last.hasClass('lc-card-img')).toBe(true);
        }
      });
    });

    it('wrapper obrazu ma grayscale z hover:grayscale-0', async () => {
      const $ = cheerio.load(await renderBlock());
      $('.lc-card-img').each((_, el) => {
        expect($(el).hasClass('grayscale')).toBe(true);
        expect($(el).hasClass('group-hover:grayscale-0')).toBe(true);
      });
    });
  });

  describe('i18n (pl/en)', () => {
    it('EN renderuje angielskie tytuły i etykiety CTA', async () => {
      const $ = cheerio.load(await renderBlock({ locale: 'en' }));
      expect($('h2').text()).toContain('How we can help');
      expect($('h3').first().text()).toContain('Process audits');
      expect($('a.lc-arrow-link').first().text()).toContain("Let's talk about it");
      expect($('.ui-type-accent-label').text()).toContain('Areas of support');
    });

    it('props data nadpisuje domyślny JSON (wzorzec "props || json")', async () => {
      const overrides: DataOverrides = {
        pl: {
          eyebrow: 'Testowy eyebrow',
          heading: 'Testowy nagłówek',
        },
      };
      const $ = cheerio.load(await renderBlock({ data: overrides }));
      expect($('h2').text()).toContain('Testowy nagłówek');
      expect($('.ui-type-accent-label').text()).toContain('Testowy eyebrow');
    });
  });

  it('nie zawiera danych projektu źródłowego', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('Optymalizacja produkcji');
    expect(html).not.toContain('Szkolenia Lean');
    expect(html).not.toContain('client-specific');
  });

  it('nie zawiera systemu data-reveal ani klienckich tokenów CSS', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('data-reveal');
    expect(html).not.toContain('border-outline');
    expect(html).not.toContain('bg-brand-cream');
    expect(html).not.toContain('text-on-surface-variant');
    expect(html).not.toContain('bg-primary-container');
  });
});
