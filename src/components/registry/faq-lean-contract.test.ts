import { describe, it, expect, beforeAll } from 'vitest';
import * as cheerio from 'cheerio';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import FaqLeanBlock from '@components/registry/faq/FaqLeanBlock.astro';

// Dlaczego: test kontraktowy renderuje PRAWDZIWY komponent Astro przez
// experimental_AstroContainer(renderToString from astro) and checks the structure
// HTML by cheerio. This allows it to detect regressions without a full run
// build, and expectations reflect the actual output of the component.
// Wzorzec: services-media-cards-contract.test.ts.

interface DataOverrides {
  pl?: {
    eyebrow?: string;
    heading?: string;
    items?: Array<{ question: string; answer: string }>;
  };
}

const PL_QUESTIONS = [
  'Jak szybko otrzymam odpowiedź?',
  'Czy pierwsza konsultacja jest płatna?',
  'Jak długo trwa współpraca?',
  'Czy pracujecie zdalnie?',
  'Co otrzymam po zakończeniu projektu?',
];

let container: AstroContainer;

async function renderBlock(props: Record<string, unknown> = {}): Promise<string> {
  return container.renderToString(FaqLeanBlock, { props });
}

describe('FaqLeanBlock, kontrakt renderowania', () => {
  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it('renderuje <section> z ui-section, tone page, id i borderem', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('section').length).toBe(1);
    expect($('section').hasClass('ui-section')).toBe(true);
    expect($('section').hasClass('ui-bg-page')).toBe(true);
    expect($('section').attr('id')).toBe('faq');
    expect($('section').hasClass('border-t')).toBe(true);
  });

  it('zawiera .ui-container', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('.ui-container').length).toBe(1);
  });

  describe('nagłówek sekcji', () => {
    it('renderuje accent-label z eyebrow i h2 z heading', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.ui-type-accent-label').text()).toContain('Najczęstsze pytania');
      expect($('h2').length).toBe(1);
      expect($('h2').text()).toContain('Jak wygląda współpraca?');
    });

    it('nagłówek jest wyśrodkowany (text-center)', async () => {
      const $ = cheerio.load(await renderBlock());
      const wrap = $('.text-center');
      expect(wrap.length).toBe(1);
      expect(wrap.hasClass('mx-auto')).toBe(true);
    });
  });

  describe('accordion', () => {
    it('renderuje dokładnie 5 elementów <details> z <summary>', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('details').length).toBe(5);
      expect($('summary').length).toBe(5);
    });

    it('details ma rounded-md (nie rounded-xl), bg-white i open:ring-2', async () => {
      const $ = cheerio.load(await renderBlock());
      $('details').each((_, el) => {
        expect($(el).hasClass('rounded-md')).toBe(true);
        expect($(el).hasClass('rounded-xl')).toBe(false);
        expect($(el).hasClass('bg-white')).toBe(true);
        expect($(el).hasClass('open:ring-2')).toBe(true);
        expect($(el).hasClass('open:ring-brand-primary/10')).toBe(true);
      });
    });

    it('summary zawiera wszystkie pytania z danych', async () => {
      const $ = cheerio.load(await renderBlock());
      const questions = $('summary').text();
      PL_QUESTIONS.forEach((q) => {
        expect(questions).toContain(q);
      });
    });

    it('każde summary ma znacznik "+" z obrotem group-open:rotate-45', async () => {
      const $ = cheerio.load(await renderBlock());
      const pluses = $('summary span').filter((_, el) => $(el).text() === '+');
      expect(pluses.length).toBe(5);
      pluses.each((_, el) => {
        expect($(el).hasClass('group-open:rotate-45')).toBe(true);
        expect($(el).hasClass('!text-xl')).toBe(true);
        expect($(el).hasClass('!font-bold')).toBe(true);
      });
    });

    it('odpowiedzi są w .lc-faq-content z borderem i tokenem brand', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.lc-faq-content').length).toBe(5);
      $('.lc-faq-content > div').each((_, el) => {
        expect($(el).hasClass('border-t')).toBe(true);
        expect($(el).hasClass('border-brand-dark/10')).toBe(true);
      });
    });

    it('odpowiedzi zawierają treść z danych', async () => {
      const $ = cheerio.load(await renderBlock());
      const answers = $('.lc-faq-content').text();
      expect(answers).toContain('Odpowiadamy na zgłoszenia w ciągu jednego dnia roboczego.');
      expect(answers).toContain('Pierwsza konsultacja służy poznaniu Twoich potrzeb');
      expect(answers).toContain('Po zakończeniu pozostajemy do dyspozycji na pytania');
    });
  });

  describe('i18n (pl/en)', () => {
    it('EN renderuje angielskie pytania i nagłówek', async () => {
      const $ = cheerio.load(await renderBlock({ locale: 'en' }));
      expect($('h2').text()).toContain('How does cooperation work?');
      expect($('summary').first().text()).toContain('How quickly will I get a reply?');
      expect($('.lc-faq-content').first().text()).toContain('We respond to inquiries');
    });

    it('props data nadpisuje domyślny JSON (wzorzec "props || json")', async () => {
      const overrides: DataOverrides = {
        pl: {
          eyebrow: 'Testowy eyebrow',
          heading: 'Testowy nagłówek',
          items: [{ question: 'Testowe pytanie?', answer: 'Testowa odpowiedź.' }],
        },
      };
      const $ = cheerio.load(await renderBlock({ data: overrides }));
      expect($('h2').text()).toContain('Testowy nagłówek');
      expect($('.ui-type-accent-label').text()).toContain('Testowy eyebrow');
      expect($('details').length).toBe(1);
      expect($('summary').text()).toContain('Testowe pytanie?');
    });
  });

  it('nie zawiera danych projektu źródłowego', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('client-specific');
    expect(html).not.toContain('audyt');
    expect(html).not.toContain('szkolenia');
    expect(html).not.toContain('zakładu');
  });

  it('nie zawiera data-reveal ani klienckich tokenów CSS', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('data-reveal');
    expect(html).not.toContain('border-outline');
    expect(html).not.toContain('bg-brand-cream');
    expect(html).not.toContain('text-on-surface-variant');
  });
});
