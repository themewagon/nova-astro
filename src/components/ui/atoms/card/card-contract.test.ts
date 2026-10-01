import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';

function renderCardHtml(props: { size?: 'sm' | 'md'; class?: string; children?: string }): string {
  const size = props.size || 'md';
  const padding = size === 'sm' ? 'py-4' : 'py-6';
  const gap = size === 'sm' ? 'gap-4' : 'gap-6';
  const classes = `flex flex-col min-w-0 rounded-xl border border-brand-dark/10 shadow-sm overflow-hidden ui-bg-page ${padding} ${gap}${props.class ? ' ' + props.class : ''}`;
  return `<div class="${classes}">${props.children || ''}</div>`;
}

function renderCardContentHtml(props: { class?: string; children?: string }): string {
  const classes = `px-6 break-words min-w-0${props.class ? ' ' + props.class : ''}`;
  return `<div class="${classes}">${props.children || ''}</div>`;
}

function renderCardHeaderHtml(props: { class?: string; children?: string }): string {
  const classes = `flex flex-col gap-1.5 px-6${props.class ? ' ' + props.class : ''}`;
  return `<div class="${classes}">${props.children || ''}</div>`;
}

function renderCardTitleHtml(props: { tag?: string; class?: string; children?: string }): string {
  const tag = props.tag || 'h3';
  const classes = `text-lg font-semibold text-brand-dark leading-tight${props.class ? ' ' + props.class : ''}`;
  return `<${tag} class="${classes}">${props.children || ''}</${tag}>`;
}

function renderCardDescriptionHtml(props: { class?: string; children?: string }): string {
  const classes = `text-sm text-brand-dark/60${props.class ? ' ' + props.class : ''}`;
  return `<p class="${classes}">${props.children || ''}</p>`;
}

function renderCardFooterHtml(props: { class?: string; children?: string }): string {
  const classes = `flex items-center gap-3 px-6 pb-6${props.class ? ' ' + props.class : ''}`;
  return `<div class="${classes}">${props.children || ''}</div>`;
}

describe('Card — kontrakt renderowania (HTML)', () => {
  describe('Card — struktura HTML', () => {
    it('renderuje <div> z klasami', () => {
      const html = renderCardHtml({ children: 'content' });
      const $ = cheerio.load(html);
      expect($('div').length).toBe(1);
      expect($('div').text()).toBe('content');
    });

    it('zawiera ui-bg-page', () => {
      const $ = cheerio.load(renderCardHtml({ children: '' }));
      expect($('div').hasClass('ui-bg-page')).toBe(true);
    });

    it('zawiera min-w-0', () => {
      const $ = cheerio.load(renderCardHtml({ children: '' }));
      expect($('div').hasClass('min-w-0')).toBe(true);
    });

    it('zawiera overflow-hidden', () => {
      const $ = cheerio.load(renderCardHtml({ children: '' }));
      expect($('div').hasClass('overflow-hidden')).toBe(true);
    });

    it('zawiera rounded-xl', () => {
      const $ = cheerio.load(renderCardHtml({ children: '' }));
      expect($('div').hasClass('rounded-xl')).toBe(true);
    });

    it('domyslnie py-6 gap-6 (size=md)', () => {
      const $ = cheerio.load(renderCardHtml({ children: '' }));
      expect($('div').hasClass('py-6')).toBe(true);
      expect($('div').hasClass('gap-6')).toBe(true);
    });
  });

  describe('Card — size', () => {
    it('size=sm uzywa py-4 gap-4', () => {
      const $ = cheerio.load(renderCardHtml({ size: 'sm', children: '' }));
      expect($('div').hasClass('py-4')).toBe(true);
      expect($('div').hasClass('gap-4')).toBe(true);
      expect($('div').hasClass('py-6')).toBe(false);
    });
  });

  describe('Card — custom class', () => {
    it('dodaje dodatkowa klase', () => {
      const $ = cheerio.load(renderCardHtml({ class: 'my-class', children: '' }));
      expect($('div').hasClass('my-class')).toBe(true);
    });
  });

  describe('CardContent', () => {
    it('renderuje <div> z contentem', () => {
      const html = renderCardContentHtml({ children: 'tresc karty' });
      const $ = cheerio.load(html);
      expect($('div').length).toBe(1);
      expect($('div').text()).toBe('tresc karty');
    });

    it('zawiera break-words', () => {
      const $ = cheerio.load(renderCardContentHtml({ children: '' }));
      expect($('div').hasClass('break-words')).toBe(true);
    });

    it('zawiera min-w-0', () => {
      const $ = cheerio.load(renderCardContentHtml({ children: '' }));
      expect($('div').hasClass('min-w-0')).toBe(true);
    });

    it('zawiera px-6', () => {
      const $ = cheerio.load(renderCardContentHtml({ children: '' }));
      expect($('div').hasClass('px-6')).toBe(true);
    });
  });

  describe('CardHeader', () => {
    it('renderuje <div> z klasami flex', () => {
      const html = renderCardHeaderHtml({ children: 'naglowek' });
      const $ = cheerio.load(html);
      expect($('div').length).toBe(1);
      expect($('div').hasClass('flex')).toBe(true);
      expect($('div').hasClass('flex-col')).toBe(true);
      expect($('div').hasClass('gap-1.5')).toBe(true);
      expect($('div').hasClass('px-6')).toBe(true);
      expect($('div').text()).toBe('naglowek');
    });
  });

  describe('CardTitle', () => {
    it('domyslnie <h3>', () => {
      const html = renderCardTitleHtml({ children: 'Tytul' });
      const $ = cheerio.load(html);
      expect($('h3').length).toBe(1);
      expect($('h3').text()).toBe('Tytul');
    });

    it('tag=h2 zmienia na <h2>', () => {
      const html = renderCardTitleHtml({ tag: 'h2', children: 'Tytul2' });
      const $ = cheerio.load(html);
      expect($('h2').length).toBe(1);
      expect($('h3').length).toBe(0);
    });

    it('zawiera text-lg font-semibold', () => {
      const $ = cheerio.load(renderCardTitleHtml({ children: 'T' }));
      expect($('h3').hasClass('text-lg')).toBe(true);
      expect($('h3').hasClass('font-semibold')).toBe(true);
    });
  });

  describe('CardDescription', () => {
    it('renderuje <p> z text-sm', () => {
      const html = renderCardDescriptionHtml({ children: 'opis' });
      const $ = cheerio.load(html);
      expect($('p').length).toBe(1);
      expect($('p').hasClass('text-sm')).toBe(true);
      expect($('p').text()).toBe('opis');
    });
  });

  describe('CardFooter', () => {
    it('renderuje <div> z klasami', () => {
      const html = renderCardFooterHtml({ children: 'stopka' });
      const $ = cheerio.load(html);
      expect($('div').length).toBe(1);
      expect($('div').hasClass('flex')).toBe(true);
      expect($('div').hasClass('items-center')).toBe(true);
      expect($('div').hasClass('gap-3')).toBe(true);
      expect($('div').hasClass('px-6')).toBe(true);
      expect($('div').hasClass('pb-6')).toBe(true);
      expect($('div').text()).toBe('stopka');
    });
  });

  describe('Card + CardContent — zlozenie', () => {
    it('laczy Card z CardContent', () => {
      const content = renderCardContentHtml({ children: 'zawartosc' });
      const html = renderCardHtml({ children: content });
      const $ = cheerio.load(html);
      expect($('div').length).toBe(2);
      expect($('div').last().hasClass('break-words')).toBe(true);
    });
  });

  describe('dlugi tekst', () => {
    it('CardContent zachowuje break-words przy dlugim tekscie', () => {
      const longWord = 'L'.repeat(80);
      const $ = cheerio.load(renderCardContentHtml({ children: longWord }));
      expect($('div').hasClass('break-words')).toBe(true);
      expect($('div').text()).toBe(longWord);
    });

    it('Card z min-w-0 i dlugim emailem', () => {
      const email = 'bardzodlugiadres@domena.pl';
      const content = renderCardContentHtml({ children: email });
      const html = renderCardHtml({ children: content });
      const $ = cheerio.load(html);
      expect($('div').first().hasClass('min-w-0')).toBe(true);
      expect($('div').last().hasClass('min-w-0')).toBe(true);
      expect($('div').last().hasClass('break-words')).toBe(true);
    });
  });
});
