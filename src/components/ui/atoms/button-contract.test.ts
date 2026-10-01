import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { formatInternalLink } from '@utils/url';

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'ui-button-primary',
  accent: 'ui-button-accent',
  outline: 'ui-button-outline',
  ghost: 'ui-button-ghost',
  secondary: 'ui-button-secondary',
  success: 'ui-button-success',
  warning: 'ui-button-warning',
  error: 'ui-button-error',
  info: 'ui-button-info',
};

function renderButtonHtml(props: {
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  disabled?: boolean;
  class?: string;
  children?: string;
  iconLeft?: string;
  iconRight?: string;
  extraAttrs?: Record<string, string>;
}): string {
  const href = props.href ? formatInternalLink(props.href) : undefined;
  const tag = href ? 'a' : 'button';
  const variant = props.variant || 'primary';
  const size = props.size || 'md';

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-9 px-4 text-xs sm:text-sm [&_svg]:size-3.5',
    md: 'h-10 sm:h-11 px-4 sm:px-5 text-sm sm:text-base [&_svg]:size-4.5',
    lg: 'h-11 sm:h-12 px-5 sm:px-8 text-sm sm:text-lg [&_svg]:size-5',
    icon: 'size-10 sm:size-11 [&_svg]:size-4.5',
  };

  const classes = [
    'ui-button ui-type-cta-label group inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all font-bold',
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    props.full ? 'w-full' : '',
    'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-primary/50',
    props.disabled ? 'pointer-events-none opacity-50' : '',
    props.class || '',
  ].filter(Boolean).join(' ');

  let extras = '';
  if (tag === 'a' && href) extras += ` href="${href}"`;
  if (tag === 'button') extras += ' disabled';
  if (tag === 'a' && props.disabled) extras += ' aria-disabled="true"';

  if (props.extraAttrs) {
    for (const [k, v] of Object.entries(props.extraAttrs)) {
      extras += ` ${k}="${v}"`;
    }
  }

  const iconLeft = props.iconLeft ? `<slot name="icon-left">${props.iconLeft}</slot>` : '<slot name="icon-left"></slot>';
  const iconRight = props.iconRight ? `<slot name="icon-right">${props.iconRight}</slot>` : '<slot name="icon-right"></slot>';
  // Dlaczego: Button od zawsze renderuje wrap z dwoma spany (default + hover),
  // text swap is the default, so the mock must map to that.
  const content = `<span class="ui-button-text-wrap"><span class="ui-button-text-default">${props.children || ''}</span><span class="ui-button-text-hover" aria-hidden="true">${props.children || ''}</span></span>`;

  return `<${tag} class="${classes}"${extras}>${iconLeft}${content}${iconRight}</${tag}>`;
}

describe('Button — kontrakt renderowania (HTML)', () => {
  describe('element HTML', () => {
    it('renderuje <button> gdy brak href', () => {
      const html = renderButtonHtml({ children: 'Klik' });
      const $ = cheerio.load(html);
      expect($('button').length).toBe(1);
      expect($('a').length).toBe(0);
    });

    it('renderuje <a> gdy href podany', () => {
      const html = renderButtonHtml({ href: '/kontakt/', children: 'Kontakt' });
      const $ = cheerio.load(html);
      expect($('a').length).toBe(1);
      expect($('a').attr('href')).toBe('/kontakt/');
    });
  });

  describe('formatInternalLink', () => {
    it('dodaje trailing slash', () => {
      const html = renderButtonHtml({ href: '/uslugi', children: 'U' });
      const $ = cheerio.load(html);
      expect($('a').attr('href')).toBe('/uslugi/');
    });

    it('zachowuje zewnetrzny link', () => {
      const html = renderButtonHtml({ href: 'https://webscale.pl', children: 'W' });
      const $ = cheerio.load(html);
      expect($('a').attr('href')).toBe('https://webscale.pl');
    });

    it('zachowuje mailto:', () => {
      const html = renderButtonHtml({ href: 'mailto:biuro@example.pl', children: 'E' });
      const $ = cheerio.load(html);
      expect($('a').attr('href')).toBe('mailto:biuro@example.pl');
    });
  });

  describe('varianty CSS', () => {
    it('primary ma klase ui-button-primary', () => {
      const html = renderButtonHtml({ variant: 'primary', children: 'K' });
      const $ = cheerio.load(html);
      expect($('button').hasClass('ui-button-primary')).toBe(true);
    });

    it('outline ma klase ui-button-outline', () => {
      const html = renderButtonHtml({ variant: 'outline', children: 'K' });
      const $ = cheerio.load(html);
      expect($('button').hasClass('ui-button-outline')).toBe(true);
    });
  });

  describe('klasy strukturalne', () => {
    it('zawsze ma ui-button i ui-type-cta-label', () => {
      const html = renderButtonHtml({ children: 'Btn' });
      const $ = cheerio.load(html);
      expect($('button').hasClass('ui-button')).toBe(true);
      expect($('button').hasClass('ui-type-cta-label')).toBe(true);
    });

    it('zawiera focus-visible ring', () => {
      const html = renderButtonHtml({ children: 'F' });
      const $ = cheerio.load(html);
      const cls = $('button').attr('class') || '';
      expect(cls).toContain('focus-visible:ring-3');
    });

    it('ma whitespace-nowrap dla ochrony przed lamaniem', () => {
      const html = renderButtonHtml({ children: 'Nie lam' });
      const $ = cheerio.load(html);
      expect($('button').hasClass('whitespace-nowrap')).toBe(true);
    });
  });

  describe('rozmiary', () => {
    it('sm ma h-9', () => {
      const html = renderButtonHtml({ size: 'sm', children: 'S' });
      const $ = cheerio.load(html);
      expect($('button').attr('class')).toContain('h-9');
    });

    it('md ma h-10', () => {
      const html = renderButtonHtml({ size: 'md', children: 'M' });
      const $ = cheerio.load(html);
      expect($('button').attr('class')).toContain('h-10');
    });

    it('lg ma h-11', () => {
      const html = renderButtonHtml({ size: 'lg', children: 'L' });
      const $ = cheerio.load(html);
      expect($('button').attr('class')).toContain('h-11');
    });
  });

  describe('slot zawartosci', () => {
    it('renderuje tekst w wrapie text swap (default + hover)', () => {
      const html = renderButtonHtml({ children: 'Kliknij mnie' });
      const $ = cheerio.load(html);
      expect($('.ui-button-text-wrap').length).toBe(1);
      expect($('.ui-button-text-default').text()).toBe('Kliknij mnie');
      expect($('.ui-button-text-hover').text()).toBe('Kliknij mnie');
      // Dlaczego: hover-span powtarza ten sam tekst, aria-hidden blokuje
      // double reading by screen readers.
      expect($('.ui-button-text-hover').attr('aria-hidden')).toBe('true');
    });

    it('zawiera sloty ikon', () => {
      const html = renderButtonHtml({
        children: 'Zapisz',
        iconLeft: '<svg data-test="icon" />',
      });
      const $ = cheerio.load(html);
      expect($('slot[name="icon-left"]').length).toBe(1);
    });
  });

  describe('full prop', () => {
    it('full=true daje w-full', () => {
      const html = renderButtonHtml({ full: true, children: 'Pelna' });
      const $ = cheerio.load(html);
      expect($('button').hasClass('w-full')).toBe(true);
    });

    it('full=false nie daje w-full', () => {
      const html = renderButtonHtml({ full: false, children: 'Normalna' });
      const $ = cheerio.load(html);
      expect($('button').hasClass('w-full')).toBe(false);
    });
  });

  describe('disabled', () => {
    it('disabled=true dodaje pointer-events-none i opacity-50', () => {
      const html = renderButtonHtml({ disabled: true, children: 'Dis' });
      const $ = cheerio.load(html);
      expect($('button').hasClass('pointer-events-none')).toBe(true);
      expect($('button').hasClass('opacity-50')).toBe(true);
    });

    it('disabled link ma aria-disabled', () => {
      const html = renderButtonHtml({ href: '/kontakt/', disabled: true, children: 'D' });
      const $ = cheerio.load(html);
      expect($('a').attr('aria-disabled')).toBe('true');
    });
  });

  describe('accessibility', () => {
    it('przekazuje aria-label', () => {
      const html = renderButtonHtml({
        children: 'Szukaj',
        extraAttrs: { 'aria-label': 'Przycisk wyszukiwania' },
      });
      const $ = cheerio.load(html);
      expect($('button').attr('aria-label')).toBe('Przycisk wyszukiwania');
    });
  });

  describe('dodatkowe klasy', () => {
    it('laczy custom class z domyslnymi', () => {
      const html = renderButtonHtml({ class: 'my-custom', children: 'C' });
      const $ = cheerio.load(html);
      expect($('button').hasClass('my-custom')).toBe(true);
      expect($('button').hasClass('ui-button')).toBe(true);
    });
  });
});
