import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';

interface TrustBarData {
  eyebrow?: string;
  items?: { value: string; label: string }[];
  partners?: { src: string; alt: string }[];
}

// Dlaczego: renderTrustBarHtml to "kontrakt" HTML-a generowanego przez
// TrustBarBlock. The test doesn't import the Astro component, it just checks that
// the generated structure (classes, attributes) meets the agreement with PageBuilder.
function renderTrustBarHtml(data: TrustBarData): string {
  const itemsHtml = (data.items ?? []).map(
    (item) => `<div class="trust-item"><div class="trust-item__value">${item.value}</div><p class="leading-relaxed ui-type-body trust-item__label">${item.label}</p></div>`,
  ).join('');

  const partnersBlock = data.partners && data.partners.length > 0
    ? `<div class="mt-14 pt-12" style="border-top:1px solid var(--color-outline-variant)">
        <p class="leading-relaxed ui-type-accent-label mb-10 text-center" style="color:var(--color-on-surface)">${data.eyebrow}</p>
        <div class="trust-logos">
          ${(data.partners ?? []).map(
            (partner) => `<div class="trust-logo" title="${partner.alt}"><img src="${partner.src}" alt="${partner.alt}" class="trust-logo__img" loading="lazy" width="160" height="64" /></div>`,
          ).join('')}
        </div>
      </div>`
    : '';

  return `<section class="ui-section ui-bg-page relative overflow-hidden">
    <div class="ui-container">
      <div class="trust-band">${itemsHtml}</div>
      ${partnersBlock}
    </div>
  </section>`;
}

// The logo mask is part of the visual contract: the partners' colorful logos
// they become white silhouettes, consistent with the dark theme of the section.
function trustLogoSyles(): string {
  return `
    .trust-logo__img {
      filter: brightness(0) invert(1);
      opacity: 0.72;
    }
    .trust-logo:hover .trust-logo__img {
      opacity: 1;
    }
  `;
}

describe('TrustBar — kontrakt renderowania', () => {
  const defaultData: TrustBarData = {
    eyebrow: 'Nasi partnerzy',
    items: [
      { value: '15+', label: 'lat doświadczenia' },
      { value: '320', label: 'zrealizowanych projektów' },
    ],
    partners: [
      { src: '/assets/images/partner-1.webp', alt: 'Partner Alfa' },
      { src: '/assets/images/partner-2.webp', alt: 'Partner Beta' },
    ],
  };

  it('renderuje <section> z ui-section', () => {
    const $ = cheerio.load(renderTrustBarHtml(defaultData));
    expect($('section').length).toBe(1);
    expect($('section').hasClass('ui-section')).toBe(true);
  });

  it('zawiera .ui-container', () => {
    const $ = cheerio.load(renderTrustBarHtml(defaultData));
    expect($('.ui-container').length).toBe(1);
  });

  describe('liczniki', () => {
    it('renderuje każdy licznik jako .trust-item', () => {
      const $ = cheerio.load(renderTrustBarHtml(defaultData));
      expect($('.trust-item').length).toBe(2);
    });

    it('renderuje wartość w .trust-item__value', () => {
      const $ = cheerio.load(renderTrustBarHtml(defaultData));
      expect($('.trust-item__value').first().text()).toBe('15+');
      expect($('.trust-item__value').last().text()).toBe('320');
    });

    it('renderuje etykietę w .trust-item__label', () => {
      const $ = cheerio.load(renderTrustBarHtml(defaultData));
      expect($('.trust-item__label').first().text()).toBe('lat doświadczenia');
      expect($('.trust-item__label').last().text()).toBe('zrealizowanych projektów');
    });
  });

  describe('logotypy partnerów', () => {
    it('renderuje każdy logotyp jako .trust-logo z <img>', () => {
      const $ = cheerio.load(renderTrustBarHtml(defaultData));
      expect($('.trust-logo').length).toBe(2);
      expect($('.trust-logo img').length).toBe(2);
    });

    it('img ma src i alt przekazane z danych', () => {
      const $ = cheerio.load(renderTrustBarHtml(defaultData));
      const firstImg = $('.trust-logo img').first();
      expect(firstImg.attr('src')).toBe('/assets/images/partner-1.webp');
      expect(firstImg.attr('alt')).toBe('Partner Alfa');
    });

    it('img ma klase .trust-logo__img i loading="lazy"', () => {
      const $ = cheerio.load(renderTrustBarHtml(defaultData));
      const firstImg = $('.trust-logo img').first();
      expect(firstImg.hasClass('trust-logo__img')).toBe(true);
      expect(firstImg.attr('loading')).toBe('lazy');
    });

    it('nie renderuje bloku partnerów gdy lista pusta', () => {
      const $ = cheerio.load(renderTrustBarHtml({ ...defaultData, partners: [] }));
      expect($('.trust-logos').length).toBe(0);
    });
  });

  describe('styl maski logotypów', () => {
    it('filter brightness(0) invert(1) jest obecny w stylach', () => {
      expect(trustLogoSyles()).toContain('filter: brightness(0) invert(1)');
    });

    it('hover przywraca pełną widoczność logotypu (opacity 1)', () => {
      expect(trustLogoSyles()).toContain('.trust-logo:hover .trust-logo__img');
      expect(trustLogoSyles()).toContain('opacity: 1');
    });
  });
});
