import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';

function renderSectionHtml(props: {
  id?: string;
  class?: string;
  tone?: 'base' | 'page' | 'accent';
  children?: string;
}): string {
  const classes = [
    'ui-section',
    props.tone === 'base' ? 'ui-bg-base' : props.tone === 'page' ? 'ui-bg-page' : props.tone === 'accent' ? 'ui-bg-accent' : '',
    props.class || '',
  ].filter(Boolean).join(' ');

  let extras = '';
  if (props.id) extras += ` id="${props.id}"`;

  return `<section${extras} class="${classes}">${props.children || ''}</section>`;
}

describe('Section — kontrakt renderowania', () => {
  it('renderuje <section>', () => {
    const $ = cheerio.load(renderSectionHtml({ children: '' }));
    expect($('section').length).toBe(1);
  });

  it('ma klase ui-section', () => {
    const $ = cheerio.load(renderSectionHtml({ children: '' }));
    expect($('section').hasClass('ui-section')).toBe(true);
  });

  it('akceptuje id', () => {
    const $ = cheerio.load(renderSectionHtml({ id: 'contact', children: '' }));
    expect($('section').attr('id')).toBe('contact');
  });

  describe('varianty tla', () => {
    it('domyslnie nie ma klasy tla', () => {
      const $ = cheerio.load(renderSectionHtml({ children: '' }));
      const cls = $('section').attr('class') || '';
      expect(cls).not.toMatch(/ui-bg-/);
    });

    it('tone=base dodaje ui-bg-base', () => {
      const $ = cheerio.load(renderSectionHtml({ tone: 'base', children: '' }));
      expect($('section').hasClass('ui-bg-base')).toBe(true);
    });

    it('tone=page dodaje ui-bg-page', () => {
      const $ = cheerio.load(renderSectionHtml({ tone: 'page', children: '' }));
      expect($('section').hasClass('ui-bg-page')).toBe(true);
    });

    it('tone=accent dodaje ui-bg-accent', () => {
      const $ = cheerio.load(renderSectionHtml({ tone: 'accent', children: '' }));
      expect($('section').hasClass('ui-bg-accent')).toBe(true);
    });
  });

  describe('children i klasy', () => {
    it('renderuje dzieci', () => {
      const $ = cheerio.load(renderSectionHtml({ children: '<p>Tresc sekcji</p>' }));
      expect($('section p').text()).toBe('Tresc sekcji');
    });

    it('dodaje custom class', () => {
      const $ = cheerio.load(renderSectionHtml({ class: 'my-section', children: '' }));
      expect($('section').hasClass('my-section')).toBe(true);
    });

    it('zachowuje ui-section z custom class', () => {
      const $ = cheerio.load(renderSectionHtml({ class: 'my-section', children: '' }));
      expect($('section').hasClass('ui-section')).toBe(true);
    });
  });

  describe('brak pustych href', () => {
    it('sekcja nie zawiera href="#"', () => {
      const $ = cheerio.load(renderSectionHtml({
        children: '<a href="/kontakt/">Kontakt</a>',
      }));
      $('a').each((_, el) => {
        expect($(el).attr('href')).not.toBe('#');
      });
    });
  });
});
