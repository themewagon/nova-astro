import { describe, it, expect, beforeAll } from 'vitest';
import * as cheerio from 'cheerio';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AboutExpertBlock from '@components/registry/about/AboutExpertBlock.astro';

// Dlaczego: test kontraktowy renderuje PRAWDZIWY komponent Astro przez
// experimental_AstroContainer (renderToString z astro, wzorzec
// services-media-cards-contract.test.ts) and checks the HTML structure via
// Cheerio. This detects regressions in bare-metal rendering
// full build, and expectations reflect the actual output of the component.
// The component combines the "ABOUT US" and "TEAM" sections from the reference layout,
// so the test also ensures that the customer's personal data has not been leaked.

const PLACEHOLDER_SRC = '/assets/placeholders/image-portrait.svg';

let container: AstroContainer;

async function renderBlock(props: Record<string, unknown> = {}): Promise<string> {
  return container.renderToString(AboutExpertBlock, { props });
}

describe('AboutExpertBlock, kontrakt renderowania', () => {
  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it('renderuje <section> z ui-section, tone page, id i borderem', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('section').length).toBe(1);
    expect($('section').hasClass('ui-section')).toBe(true);
    expect($('section').hasClass('ui-bg-page')).toBe(true);
    expect($('section').attr('id')).toBe('o-nas');
    expect($('section').hasClass('border-t')).toBe(true);
  });

  it('zawiera .ui-container', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('.ui-container').length).toBe(1);
  });

  describe('karta split', () => {
    it('karta ma grid 2 kolumny (0.92fr / 1.08fr) z tokenami brand', async () => {
      const $ = cheerio.load(await renderBlock());
      const card = $('.rounded-md.border');
      expect(card.length).toBe(1);
      expect(card.hasClass('lg:grid-cols-[0.92fr_1.08fr]')).toBe(true);
      expect(card.hasClass('border-brand-dark/10')).toBe(true);
      expect(card.hasClass('bg-white')).toBe(true);
      expect(card.hasClass('shadow-soft')).toBe(true);
      expect(card.hasClass('overflow-hidden')).toBe(true);
    });

    it('portret to div z tłem obrazowym i placeholderem biblioteki', async () => {
      const $ = cheerio.load(await renderBlock());
      const portrait = $('[role="img"]');
      expect(portrait.length).toBe(1);
      expect(portrait.attr('style')).toContain('background-image');
      expect(portrait.attr('style')).toContain(PLACEHOLDER_SRC);
      expect(portrait.hasClass('min-h-[380px]')).toBe(true);
      expect(portrait.hasClass('bg-cover')).toBe(true);
      expect(portrait.attr('aria-label')).toContain('Portret');
    });
  });

  describe('treść eksperta', () => {
    it('renderuje eyebrow (accent-label), h2 z imieniem i lead z rolą', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.ui-type-accent-label').text()).toContain('Twój partner Lean');
      expect($('h2').length).toBe(1);
      expect($('h2').text()).toContain('Imię i nazwisko eksperta');
      expect($('.ui-type-lead').text()).toContain('Konsultant Lean Management');
    });

    it('renderuje bio w akapicie body z tokenem text-brand-dark/70', async () => {
      const $ = cheerio.load(await renderBlock());
      const bio = $('.ui-type-body');
      expect(bio.length).toBe(1);
      expect(bio.text()).toContain('wiedzę inżynierską');
      expect(bio.hasClass('text-brand-dark/70')).toBe(true);
    });
  });

  describe('checki', () => {
    it('renderuje co najmniej 3 checki z ✓ w kolorze accent', async () => {
      const $ = cheerio.load(await renderBlock());
      const items = $('ul li');
      expect(items.length).toBeGreaterThanOrEqual(3);
      items.each((_, el) => {
        expect($(el).children('span').first().hasClass('text-brand-accent')).toBe(true);
        expect($(el).text()).toContain('✓');
      });
    });
  });

  describe('tagi metod', () => {
    it('renderuje co najmniej 3 tagi z tłem bg-brand-primary/10', async () => {
      const $ = cheerio.load(await renderBlock());
      const tags = $('span.text-brand-primary');
      expect(tags.length).toBeGreaterThanOrEqual(3);
      tags.each((_, el) => {
        expect($(el).hasClass('bg-brand-primary/10')).toBe(true);
        expect($(el).hasClass('rounded-sm')).toBe(true);
      });
    });

    it('tagi pokazują metody Lean (VSM, Kaizen, 5S, SMED, TPM)', async () => {
      const $ = cheerio.load(await renderBlock());
      const tagTexts = $('span.text-brand-primary')
        .map((_, el) => $(el).text().trim())
        .get();
      expect(tagTexts).toContain('VSM');
      expect(tagTexts).toContain('Kaizen');
      expect(tagTexts).toContain('TPM');
    });
  });

  describe('link LinkedIn', () => {
    it('renderuje link z href linkedin.com, target blank i rel noopener', async () => {
      const $ = cheerio.load(await renderBlock());
      const link = $('a[target="_blank"]');
      expect(link.length).toBe(1);
      expect(link.attr('href')).toContain('linkedin.com');
      expect(link.attr('rel')).toContain('noopener');
      expect(link.attr('aria-label')).toContain('LinkedIn');
      expect(link.hasClass('lc-btn-slide')).toBe(true);
      expect(link.hasClass('lc-btn-slide-teal')).toBe(true);
    });
  });

  describe('i18n (pl/en)', () => {
    it('EN renderuje angielskie treści', async () => {
      const $ = cheerio.load(await renderBlock({ locale: 'en' }));
      expect($('.ui-type-accent-label').text()).toContain('Your Lean partner');
      expect($('h2').text()).toContain('Expert name and surname');
      expect($('.ui-type-lead').text()).toContain('Lean Management Consultant');
      expect($('.ui-type-body').text()).toContain('engineering knowledge');
    });

    it('props data nadpisują JSON (wzorzec "props || json")', async () => {
      const custom = {
        imageSrc: PLACEHOLDER_SRC,
        imageAlt: 'Alternatywny portret',
        pl: {
          eyebrow: 'Custom eyebrow',
          name: 'Anna Przykładowa',
          role: 'Konsultantka',
          bio: 'Własna biografia.',
          checks: ['Punkt A', 'Punkt B', 'Punkt C'],
          tags: ['Alfa', 'Beta', 'Gamma'],
          linkedinLabel: 'in',
          linkedinUrl: 'https://linkedin.com/company/example/',
        },
      };
      const $ = cheerio.load(await renderBlock({ data: custom }));
      expect($('h2').text()).toContain('Anna Przykładowa');
      expect($('.ui-type-accent-label').text()).toContain('Custom eyebrow');
      expect($('a[target="_blank"]').attr('href')).toContain('linkedin.com/company/example');
    });
  });

  it('nie zawiera data-reveal ani danych osobowych klienta', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('data-reveal');
    expect(html).not.toContain('Piotr');
    expect(html).not.toContain('Kowalczyk');
    expect(html).not.toContain('client-specific');
    expect(html).not.toContain('piotrkowalczyk');
  });

  it('nie zawiera klienckich tokenów CSS', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('border-outline');
    expect(html).not.toContain('bg-brand-cream');
    expect(html).not.toContain('--color-primary-container');
  });
});
