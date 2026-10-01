// Test kontraktowy bloku FeaturesOfferCardsBlock, wzorowany na
// hero-cinematic-contract.test.ts. Checks the structure of pricing cards:
// ghost number in Anton, badge on the middle card, price, price variants,
// lista funkcji i CTA jako przycisk primary.
import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import offerData from '@data/sections/features-offer.json';

interface OfferItem {
  icon: string;
  title: string;
  description: string;
  price: string;
  priceNote: string;
  priceOptions: string[];
  priceNote2: string;
  cta: string;
  features: string[];
}

interface OfferCardsData {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaHover: string;
  popularBadge: string;
  emptyPriceLabel: string;
  ctaFallback: { label: string; href: string };
  items: OfferItem[];
}

function renderFeaturesOfferHtml(data: OfferCardsData): string {
  const numbered = data.items.map((item, index) => ({
    ...item,
    num: String(index + 1).padStart(2, '0'),
    popular: index === 1,
  }));

  const cardHtml = numbered
    .map((item) => {
      const cardClasses = item.popular
        ? 'ui-glow-card group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-7 transition-all duration-300 border-brand-primary/60 lg:-translate-y-3 lg:hover:-translate-y-4'
        : 'ui-glow-card group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-7 transition-all duration-300 border-brand-dark/15 hover:-translate-y-1.5 hover:border-brand-primary/40';

      const badgeHtml = item.popular
        ? `<span class="absolute right-0 top-0 rounded-bl-lg bg-brand-primary px-3 py-1 font-bold text-[10px] uppercase italic tracking-[0.18em] text-white">${data.popularBadge}</span>`
        : '';

      const priceHtml = item.price
        ? `<span class="font-[Anton] text-5xl leading-none text-brand-primary">${item.price}</span>
           <span class="text-sm font-bold uppercase tracking-[0.15em] text-brand-dark/60">${item.priceNote}</span>`
        : `<span class="text-sm font-bold uppercase tracking-[0.2em] text-brand-primary">${data.emptyPriceLabel}</span>`;

      const priceOptionsHtml = (item.priceOptions || [])
        .map(
          (opt) => `<li class="flex items-center gap-2 text-sm text-brand-dark/70">
            <span aria-hidden="true" class="size-1 shrink-0 rounded-full bg-brand-primary/60"></span>${opt}
          </li>`,
        )
        .join('');

      const featuresHtml = (item.features || [])
        .map(
          (feature) => `<li class="flex items-start gap-3 text-sm leading-snug text-brand-dark/70">
            <span aria-hidden="true" class="mt-[7px] size-1 shrink-0 rounded-full bg-brand-primary/60"></span>${feature}
          </li>`,
        )
        .join('');

      return `<article class="${cardClasses}">
        <span aria-hidden="true" class="pointer-events-none absolute -right-2 -top-7 font-[Anton] text-[7rem] leading-none text-neutral-900 opacity-30 transition-opacity duration-300 group-hover:opacity-10">${item.num}</span>
        ${badgeHtml}
        <div class="mb-6 flex size-12 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary transition-all duration-300 group-hover:bg-brand-primary group-hover:text-white">
          <i class="ph ph-${item.icon} text-2xl"></i>
        </div>
        <h3 class="text-lg font-bold uppercase leading-none tracking-[0.02em] text-brand-dark">${item.title}</h3>
        <p class="leading-relaxed ui-type-body mt-3 text-sm leading-relaxed text-brand-dark/70">${item.description}</p>
        <div class="mt-6 flex items-baseline gap-2">${priceHtml}</div>
        <ul class="mt-4 space-y-1.5">${priceOptionsHtml}</ul>
        <p class="mt-4 rounded-lg border border-brand-primary/20 bg-brand-primary/5 px-3 py-2 text-sm font-semibold leading-snug text-brand-primary md:text-base">${item.priceNote2}</p>
        <ul class="mt-6 space-y-2.5 border-t border-brand-dark/15 pt-5">${featuresHtml}</ul>
        <div class="mt-auto pt-7">
          <a href="${data.ctaFallback.href}" class="ui-button ui-button-primary group inline-flex items-center justify-center gap-1.5 rounded-md whitespace-nowrap transition-all font-semibold h-11 sm:h-12 px-5 sm:px-8 text-sm sm:text-lg w-full">${item.cta}</a>
        </div>
      </article>`;
    })
    .join('');

  return `<section class="ui-section ui-bg-page relative">
    <div class="ui-container">
      <div class="relative">
        <div class="ui-glow ui-glow-sec ui-glow-offers" aria-hidden="true"></div>
        <div class="relative mb-12 flex flex-col items-center text-center">
          <span class="ui-type-accent-label mb-4">${data.eyebrow}</span>
          <h2 class="font-heading font-bold ui-type-section-title text-brand-dark">${data.title}</h2>
          <p class="leading-relaxed ui-type-lead mt-4 max-w-2xl text-brand-dark/70">${data.subtitle}</p>
        </div>
        <div class="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">${cardHtml}</div>
      </div>
    </div>
  </section>`;
}

describe('FeaturesOfferCards — kontrakt renderowania', () => {
  const defaultData: OfferCardsData = {
    eyebrow: 'Współpraca',
    title: 'Wybierz zakres współpracy',
    subtitle: 'Trzy poziomy zaangażowania: od szybkiego startu po pełną opiekę.',
    ctaHover: 'Wybieram tę ofertę',
    popularBadge: 'Najpopularniejszy',
    emptyPriceLabel: 'Zapisz się',
    ctaFallback: { label: 'Wybieram', href: '/#kontakt' },
    items: [
      {
        icon: 'star',
        title: 'Podstawowy',
        description: 'Lekki start dla małych projektów.',
        price: '299 zł',
        priceNote: '/ miesiąc',
        priceOptions: ['299 zł / miesiąc', 'Bez umowy na czas określony'],
        priceNote2: 'Dobry wybór, aby przetestować współpracę',
        cta: 'WYBIERZ',
        features: ['Konsultacja wstępna', 'Dedykowany opiekun projektu', 'Raport miesięczny'],
      },
      {
        icon: 'shield',
        title: 'Rozszerzony',
        description: 'Zrównoważony zakres dla rosnących firm.',
        price: '499 zł',
        priceNote: '/ miesiąc',
        priceOptions: ['499 zł / miesiąc', 'Umowa 3-miesięczna'],
        priceNote2: 'Najczęściej wybierany wariant współpracy',
        cta: 'WYBIERZ',
        features: ['Wszystko z wariantu Podstawowy', 'Wsparcie telefoniczne'],
      },
      {
        icon: 'gear',
        title: 'Premium',
        description: 'Pełna opieka i maksymalna elastyczność.',
        price: '799 zł',
        priceNote: '/ miesiąc',
        priceOptions: ['799 zł / miesiąc', 'Dedykowany zespół'],
        priceNote2: 'Dla firm, które oczekują pełnego zaangażowania',
        cta: 'WYBIERZ',
        features: ['Wszystko z wariantu Rozszerzony', 'Priorytet 24/7'],
      },
    ],
  };

  it('renderuje <section> z ui-section i jasnym tłem (ui-bg-page)', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    expect($('section').length).toBe(1);
    expect($('section').hasClass('ui-section')).toBe(true);
    expect($('section').hasClass('ui-bg-page')).toBe(true);
  });

  it('zawiera .ui-container, h2 z tytułem i etykietę akcentową', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    expect($('.ui-container').length).toBe(1);
    expect($('h2').length).toBe(1);
    expect($('h2').text()).toBe('Wybierz zakres współpracy');
    expect($('.ui-type-accent-label').text()).toBe('Współpraca');
  });

  it('ma glow ofert (ui-glow ui-glow-sec ui-glow-offers)', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    const glow = $('.ui-glow-offers');
    expect(glow.length).toBe(1);
    expect(glow.hasClass('ui-glow')).toBe(true);
    expect(glow.hasClass('ui-glow-sec')).toBe(true);
    expect(glow.attr('aria-hidden')).toBe('true');
  });

  it('grid kart ma 3 kolumny na lg', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    const grid = $('.lg\\:grid-cols-3');
    expect(grid.length).toBe(1);
    expect(grid.hasClass('sm:grid-cols-2')).toBe(true);
  });

  it('renderuje dokładnie 3 karty pricingowe (article)', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    const cards = $('article');
    expect(cards.length).toBe(3);
    cards.each((_, el) => {
      expect($(el).hasClass('ui-glow-card')).toBe(true);
      expect($(el).hasClass('rounded-2xl')).toBe(true);
      expect($(el).hasClass('bg-white')).toBe(true);
    });
  });

  it('karty mają ghost number 01/02/03 w Antonie (text-[7rem])', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    const ghosts = $('article span.text-\\[7rem\\]');
    expect(ghosts.length).toBe(3);
    expect(ghosts.eq(0).text()).toBe('01');
    expect(ghosts.eq(1).text()).toBe('02');
    expect(ghosts.eq(2).text()).toBe('03');
    ghosts.each((_, el) => {
      expect($(el).hasClass('font-[Anton]')).toBe(true);
      expect($(el).hasClass('opacity-30')).toBe(true);
      expect($(el).hasClass('group-hover:opacity-10')).toBe(true);
    });
  });

  it('badge jest tylko na środkowej karcie (items[1])', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    const badges = $('article span.bg-brand-primary');
    expect(badges.length).toBe(1);
    const badge = badges.eq(0);
    expect(badge.text()).toBe('Najpopularniejszy');
    expect(badge.hasClass('rounded-bl-lg')).toBe(true);
    expect(badge.hasClass('uppercase')).toBe(true);
    expect(badge.hasClass('italic')).toBe(true);
    expect(badge.hasClass('tracking-[0.18em]')).toBe(true);
    expect(badge.parent().text()).toContain('Rozszerzony');
    expect(badge.parent().hasClass('border-brand-primary/60')).toBe(true);
  });

  it('środkowa karta jest wyróżniona (border-brand-primary/60, uniesiona)', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    const cards = $('article');
    expect(cards.eq(1).hasClass('border-brand-primary/60')).toBe(true);
    expect(cards.eq(1).hasClass('lg:-translate-y-3')).toBe(true);
    expect(cards.eq(0).hasClass('border-brand-dark/15')).toBe(true);
    expect(cards.eq(0).hasClass('hover:-translate-y-1.5')).toBe(true);
  });

  it('karty mają ikony Phosphor (star, shield, gear)', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    expect($('.ph.ph-star').length).toBe(1);
    expect($('.ph.ph-shield').length).toBe(1);
    expect($('.ph.ph-gear').length).toBe(1);
    const iconWrap = $('article div.size-12');
    expect(iconWrap.length).toBe(3);
    expect(iconWrap.eq(0).hasClass('bg-brand-primary/10')).toBe(true);
    expect(iconWrap.eq(0).hasClass('group-hover:bg-brand-primary')).toBe(true);
  });

  it('każda karta ma cenę w Antonie z akcentowym kolorem', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    const prices = $('article .font-\\[Anton\\].text-5xl');
    expect(prices.length).toBe(3);
    expect(prices.eq(0).text()).toBe('299 zł');
    expect(prices.eq(1).text()).toBe('499 zł');
    expect(prices.eq(2).text()).toBe('799 zł');
    prices.each((_, el) => {
      expect($(el).hasClass('text-brand-primary')).toBe(true);
    });
  });

  it('karty mają priceNote (uppercase tracking)', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    const notes = $('article span.tracking-\\[0\\.15em\\]');
    expect(notes.length).toBe(3);
    expect(notes.eq(0).text()).toBe('/ miesiąc');
  });

  it('warianty cenowe renderują kropki akcentu (priceOptions)', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    const dots = $('article ul.mt-4 li span.bg-brand-primary\\/60');
    expect(dots.length).toBe(6);
    expect($('article ul.mt-4 li').length).toBe(6);
  });

  it('każda karta ma notkę cenową priceNote2 (bg-brand-primary/5)', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    const notes = $('article p.bg-brand-primary\\/5');
    expect(notes.length).toBe(3);
    expect(notes.eq(1).text()).toBe('Najczęściej wybierany wariant współpracy');
    expect(notes.eq(0).hasClass('rounded-lg')).toBe(true);
  });

  it('lista funkcji jest oddzielona linią (border-t) i ma kropki', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    const lists = $('article ul.border-t');
    expect(lists.length).toBe(3);
    expect(lists.eq(0).find('li').length).toBe(3);
    expect(lists.eq(1).find('li').length).toBe(2);
    expect(lists.eq(2).find('li').length).toBe(2);
    const dots = $('article ul.border-t li span.bg-brand-primary\\/60');
    expect(dots.length).toBe(7);
  });

  it('każda karta ma CTA jako przycisk primary w-full', () => {
    const $ = cheerio.load(renderFeaturesOfferHtml(defaultData));
    const ctas = $('article a.ui-button-primary');
    expect(ctas.length).toBe(3);
    ctas.each((_, el) => {
      expect($(el).hasClass('w-full')).toBe(true);
    });
    expect(ctas.eq(0).text()).toBe('WYBIERZ');
    expect(ctas.eq(0).attr('href')).toBe('/#kontakt');
  });

  it('JSON dostarcza 3 oferty z cenami i badge na środkowej', () => {
    expect(offerData.items.length).toBe(3);
    expect(offerData.items.map((item) => item.price)).toEqual(['299 zł', '499 zł', '799 zł']);
    expect(offerData.items[1].title).toBe('Rozszerzony');
    expect(offerData.popularBadge).toBe('Najpopularniejszy');
    expect(offerData.items.every((item) => (item.features || []).length > 0)).toBe(true);
  });
});
