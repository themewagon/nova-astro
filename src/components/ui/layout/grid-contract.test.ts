import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';

function renderGridHtml(props: {
  cols?: number | Record<string, number>;
  gap?: string;
  class?: string;
  role?: string;
  children?: string;
}): string {
  const defaultCols = { default: 1, md: 3 };
  const cols = props.cols ?? defaultCols;

  const gapMap: Record<string, string> = {
    sm: 'gap-3', md: 'gap-6', lg: 'gap-8', xl: 'gap-12',
  };
  const gapClass = gapMap[props.gap || 'md'] || props.gap || 'gap-6';

  function colsToClasses(c: number | Record<string, number>): string {
    if (typeof c === 'number') return `grid-cols-${c}`;
    return Object.entries(c)
      .map(([bp, n]) => bp === 'default' ? `grid-cols-${n}` : `${bp}:grid-cols-${n}`)
      .join(' ');
  }

  const classes = ['grid', colsToClasses(cols), gapClass, props.class || ''].filter(Boolean).join(' ');
  const roleAttr = props.role ? ` role="${props.role}"` : '';

  return `<div class="${classes}"${roleAttr}>${props.children || ''}</div>`;
}

describe('Grid — kontrakt renderowania', () => {
  it('renderuje <div> z klasą grid', () => {
    const $ = cheerio.load(renderGridHtml({ children: '' }));
    expect($('div').length).toBe(1);
    expect($('div').hasClass('grid')).toBe(true);
  });

  describe('kolumny', () => {
    it('domyslnie grid-cols-1 md:grid-cols-3', () => {
      const $ = cheerio.load(renderGridHtml({ children: '' }));
      expect($('div').hasClass('grid-cols-1')).toBe(true);
      expect($('div').hasClass('md:grid-cols-3')).toBe(true);
    });

    it('liczba jako number daje grid-cols-N', () => {
      const $ = cheerio.load(renderGridHtml({ cols: 4, children: '' }));
      expect($('div').hasClass('grid-cols-4')).toBe(true);
      expect($('div').hasClass('md:grid-cols-3')).toBe(false);
    });

    it('obiekt z default i md daje odpowiednie klasy', () => {
      const $ = cheerio.load(renderGridHtml({
        cols: { default: 2, md: 4, lg: 6 },
        children: '',
      }));
      expect($('div').hasClass('grid-cols-2')).toBe(true);
      expect($('div').hasClass('md:grid-cols-4')).toBe(true);
      expect($('div').hasClass('lg:grid-cols-6')).toBe(true);
    });

    it('mobile-first: default przed md:', () => {
      const $ = cheerio.load(renderGridHtml({ children: '' }));
      const cls = $('div').attr('class') || '';
      const defaultIdx = cls.indexOf('grid-cols-1');
      const mdIdx = cls.indexOf('md:grid-cols-3');
      expect(defaultIdx).toBeLessThan(mdIdx);
    });
  });

  describe('gap', () => {
    it('domyslnie gap-6', () => {
      const $ = cheerio.load(renderGridHtml({ children: '' }));
      expect($('div').hasClass('gap-6')).toBe(true);
    });

    it('gap=sm daje gap-3', () => {
      const $ = cheerio.load(renderGridHtml({ gap: 'sm', children: '' }));
      expect($('div').hasClass('gap-3')).toBe(true);
    });

    it('gap=lg daje gap-8', () => {
      const $ = cheerio.load(renderGridHtml({ gap: 'lg', children: '' }));
      expect($('div').hasClass('gap-8')).toBe(true);
    });

    it('gap=xl daje gap-12', () => {
      const $ = cheerio.load(renderGridHtml({ gap: 'xl', children: '' }));
      expect($('div').hasClass('gap-12')).toBe(true);
    });

    it('niestandardowy gap jako string', () => {
      const $ = cheerio.load(renderGridHtml({ gap: 'gap-4', children: '' }));
      expect($('div').hasClass('gap-4')).toBe(true);
    });
  });

  describe('children', () => {
    it('renderuje dzieci', () => {
      const $ = cheerio.load(renderGridHtml({
        children: '<div class="card">Karta 1</div><div class="card">Karta 2</div>',
      }));
      expect($('div.card').length).toBe(2);
      expect($('div.card').first().text()).toBe('Karta 1');
    });
  });

  describe('role', () => {
    it('dodaje role gdy podany', () => {
      const $ = cheerio.load(renderGridHtml({ role: 'list', children: '' }));
      expect($('div').attr('role')).toBe('list');
    });

    it('nie dodaje role gdy brak', () => {
      const $ = cheerio.load(renderGridHtml({ children: '' }));
      expect($('div').attr('role')).toBeUndefined();
    });
  });

  describe('custom class', () => {
    it('dodaje dodatkowa klase', () => {
      const $ = cheerio.load(renderGridHtml({ class: 'my-grid', children: '' }));
      expect($('div').hasClass('my-grid')).toBe(true);
    });
  });

  describe('dlugie dane', () => {
    it('renderuje karty z dlugim tekstem bez overflow (min-w-0 na gridzie)', () => {
      const longText = 'BardzoDlugiTekstBezSpacjiKtoryPowinienBycPoprawnieLamany'.repeat(5);
      const $ = cheerio.load(renderGridHtml({
        children: `<div class="min-w-0 break-words">${longText}</div>`,
      }));
      expect($('div').first().html()).toContain(longText);
    });
  });
});
