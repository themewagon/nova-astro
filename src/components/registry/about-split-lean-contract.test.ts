import { describe, it, expect, beforeAll } from 'vitest';
import * as cheerio from 'cheerio';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AboutSplitLeanBlock from '@components/registry/about/AboutSplitLeanBlock.astro';

// Dlaczego: test kontraktowy renderuje PRAWDZIWY komponent Astro przez
// experimental_AstroContainer(renderToString from astro) and checks the structure
// HTML by cheerio. Expectations reflect the "WHO WE ARE" section
// ze strony referencyjnej: split 2 kolumny z tekstem,
// obrazem i gradientowym overlay. Wzorzec: services-media-cards-contract.test.ts.

let container: AstroContainer;

async function renderBlock(props: Record<string, unknown> = {}): Promise<string> {
  return container.renderToString(AboutSplitLeanBlock, { props });
}

describe('AboutSplitLeanBlock, kontrakt renderowania', () => {
  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it('renderuje <section> z ui-section, tone page, id i borderem', async () => {
    const $ = cheerio.load(await renderBlock({ id: 'kim-jestesmy' }));
    expect($('section').length).toBe(1);
    expect($('section').hasClass('ui-section')).toBe(true);
    expect($('section').hasClass('ui-bg-page')).toBe(true);
    expect($('section').attr('id')).toBe('kim-jestesmy');
    expect($('section').hasClass('border-t')).toBe(true);
  });

  it('zawiera .ui-container i grid 2 kolumn na desktopie', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('.ui-container').length).toBe(1);
    expect($('section .lg\\:grid-cols-2').length).toBe(1);
  });

  describe('kolumna tekstowa', () => {
    it('renderuje eyebrow (accent-label)', async () => {
      const $ = cheerio.load(await renderBlock());
      const eyebrow = $('p').first();
      expect(eyebrow.text().trim()).toBe('Kim jesteśmy');
      expect(eyebrow.hasClass('ui-type-accent-label')).toBe(true);
    });

    it('renderuje h2 z dwiema liniami i <br>', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('h2').length).toBe(1);
      expect($('h2 br').length).toBe(1);
      expect($('h2').text()).toContain('Inżynieria procesów');
    });

    it('renderuje dwa paragrafy opisu', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('h2').nextAll('p').length).toBeGreaterThanOrEqual(2);
    });

    it('renderuje kreskę dekoracyjną bg-brand-primary/40', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('div.bg-brand-primary\\/40').length).toBe(1);
    });

    it('renderuje CTA z formatInternalLink (trailing slash)', async () => {
      const $ = cheerio.load(await renderBlock());
      const btn = $('a[href="/kontakt/"]').first();
      expect(btn.length).toBe(1);
      expect(btn.text().trim()).toContain('Porozmawiajmy o procesach');
    });
  });

  describe('kolumna obrazu', () => {
    it('renderuje obraz z placeholderem i aspect-[4/3]', async () => {
      const $ = cheerio.load(await renderBlock());
      const img = $('img').first();
      expect(img.attr('src')).toBe('/assets/placeholders/image-landscape.svg');
      expect(img.hasClass('aspect-[4/3]')).toBe(true);
      expect(img.attr('alt')).toContain('Tablica procesów');
    });

    it('renderuje gradientowy overlay na obrazie', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('div[style*="linear-gradient"]').length).toBe(1);
    });
  });

  describe('i18n i czystość biblioteki', () => {
    it('renderuje wersję EN gdy locale=en', async () => {
      const $ = cheerio.load(await renderBlock({ locale: 'en' }));
      expect($('p').first().text().trim()).toBe('Who we are');
      expect($('h2').text()).toContain('Process engineering');
    });

    it('pozwala nadpisać dane przez props.data', async () => {
      const $ = cheerio.load(
        await renderBlock({
          locale: 'pl',
          data: {
            eyebrow: 'Custom',
            headingLines: ['Linia 1', 'Linia 2'],
            paragraphs: ['Akapit testowy'],
            ctaLabel: 'Działaj',
            ctaHref: '/start/',
            imageSrc: '/assets/placeholders/image-portrait.svg',
            imageAlt: 'Test',
          },
        }),
      );
      expect($('p').first().text().trim()).toBe('Custom');
      expect($('a[href="/start/"]').length).toBe(1);
      expect($('h2').text()).toContain('Linia 1');
    });

    it('nie zawiera danych projektu źródłowego', async () => {
      const $ = cheerio.load(await renderBlock());
      const html = $('body').html() ?? '';
      expect(html).not.toContain('Piotr');
      expect(html).not.toContain('client-specific');
    });

    it('nie zawiera klas data-reveal ani klienckich tokenów', async () => {
      const $ = cheerio.load(await renderBlock());
      const html = $('body').html() ?? '';
      expect(html).not.toContain('data-reveal');
      expect(html).not.toContain('border-outline');
      expect(html).not.toContain('primary-container');
      expect(html).not.toContain('text-on-surface-variant');
    });
  });
});
