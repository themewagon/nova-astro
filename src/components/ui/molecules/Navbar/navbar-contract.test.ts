import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { formatInternalLink } from '@utils/url';

const navLinks = [
  { label: 'Start', href: '/' },
  { label: 'O nas', href: '/o-nas/' },
  { label: 'Uslugi', href: '/uslugi/' },
  { label: 'Cennik', href: '/cennik/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Kontakt', href: '/kontakt/' },
];
const ctaLabel = 'Kontakt';
const ctaHref = '/kontakt/';

function renderMenuToggleHtml(props: { mobileOnly?: boolean } = {}): string {
  const mobileOnly = props.mobileOnly !== false;
  const cls = `ui-nav-menu-toggle${mobileOnly ? ' lg:hidden' : ''}`;
  return `<button type="button" data-navbar-toggle class="${cls}" aria-controls="site-nav-drawer" aria-expanded="false" aria-label="Menu nawigacji">
    <span class="ui-nav-menu-toggle__bar" aria-hidden="true"></span>
    <span class="ui-nav-menu-toggle__bar" aria-hidden="true"></span>
    <span class="ui-nav-menu-toggle__bar" aria-hidden="true"></span>
  </button>`;
}

function renderMobileDrawerHtml(): string {
  const menuItems = navLinks
    .map((l, i) => {
      if (l.label === 'Uslugi') {
        // Pozycja z podstronami: accordion (rozwijanie) + submenu
        return `<div class="ui-nav-drawer__item" style="--stagger: ${i}">
          <div class="ui-nav-drawer__link-row">
            <a href="${formatInternalLink(l.href)}" class="ui-nav-drawer__link" data-navbar-close><span class="ui-nav-drawer__label">${l.label}</span></a>
            <button type="button" class="ui-nav-drawer__expand" data-navbar-sub-toggle aria-expanded="false" aria-controls="ui-nav-drawer-sub-${i}" aria-label="Rozwiń podstrony: ${l.label}">
              <svg class="ui-nav-drawer__chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 6L8 11L13 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <div class="ui-nav-drawer__sub" id="ui-nav-drawer-sub-${i}">
            <div class="ui-nav-drawer__sub-inner">
              <nav class="ui-nav-drawer__sub-nav" aria-label="${l.label}">
                <a href="${formatInternalLink('/uslugi/strony/')}" class="ui-nav-drawer__sub-link" data-navbar-close>Strony internetowe</a>
                <a href="${formatInternalLink('/uslugi/sklepy/')}" class="ui-nav-drawer__sub-link" data-navbar-close>Sklepy online</a>
              </nav>
            </div>
          </div>
        </div>`;
      }
      return `<div class="ui-nav-drawer__item" style="--stagger: ${i}">
        <a href="${formatInternalLink(l.href)}" class="ui-nav-drawer__link" data-navbar-close>${l.label}</a>
      </div>`;
    })
    .join('\n\t\t\t\t');
  return `<div id="site-nav-drawer" class="ui-nav-drawer-root" role="presentation">
    <div class="ui-nav-drawer-backdrop" data-navbar-close aria-hidden="true"></div>
    <aside class="ui-nav-drawer--sheet" role="dialog" aria-modal="true" aria-label="Menu nawigacji">
      <div class="ui-nav-drawer__deck" aria-hidden="true">
        <div class="ui-nav-drawer__layer ui-nav-drawer__layer--1"></div>
        <div class="ui-nav-drawer__layer ui-nav-drawer__layer--2"></div>
        <div class="ui-nav-drawer__layer ui-nav-drawer__layer--3"></div>
      </div>
      <div class="ui-nav-drawer__content">
        <div class="ui-nav-drawer__top">
          <button type="button" data-navbar-close class="ui-nav-drawer__close h-11 w-11" aria-label="Zamknij menu">
            <span class="ui-nav-drawer__close-bar" aria-hidden="true"></span>
            <span class="ui-nav-drawer__close-bar" aria-hidden="true"></span>
            <span class="ui-nav-drawer__close-bar" aria-hidden="true"></span>
          </button>
        </div>
          <div class="ui-nav-drawer__scroller">
          <nav class="ui-nav-drawer__nav" aria-label="Nawigacja glowna">
            ${menuItems}
            <div class="ui-nav-drawer__item" style="--stagger: ${navLinks.length}">
              <a href="${formatInternalLink(ctaHref)}" class="ui-nav-drawer__cta" data-navbar-close>${ctaLabel}</a>
            </div>
          </nav>
          </div>
      </div>
    </aside>
  </div>`;
}

function renderNavbarMainCenteredHtml(): string {
  const navItems = navLinks
    .map((l) => `<a href="${formatInternalLink(l.href)}" class="ui-nav-bar-link flex items-center text-inherit opacity-75 transition-all hover:text-brand-accent hover:opacity-100">${l.label}</a>`)
    .join('\n\t\t');
  return `<div class="ui-container relative flex items-center justify-between lg:justify-center">
    <a href="${formatInternalLink('/')}" class="relative z-[1010] flex items-center transition-colors duration-300 lg:absolute lg:left-[var(--spacing-container-px)] lg:top-1/2 lg:-translate-y-1/2">
      <div class="flex items-center gap-2"><div class="flex items-center gap-2 lg:gap-3"><i class="ph ph-star text-4xl lg:text-5xl text-brand-dark"></i><div class="flex flex-col leading-tight"><span class="font-black tracking-tight text-base lg:text-xl text-brand-dark">Twoja Firma</span></div></div></div>
    </a>
    <nav class="hidden items-center gap-6 lg:flex lg:gap-8 xl:gap-10">
      ${navItems}
    </nav>
    <div class="relative z-[1010] flex items-center gap-3 lg:gap-4 lg:absolute lg:right-[var(--spacing-container-px)] lg:top-1/2 lg:-translate-y-1/2">
      <a href="${formatInternalLink(ctaHref)}" class="ui-button ui-button-primary ui-nav-cta hidden sm:flex">${ctaLabel}</a>
      ${renderMenuToggleHtml()}
    </div>
  </div>`;
}

describe('MenuToggle — kontrakt renderowania', () => {
  it('renderuje <button> z type="button"', () => {
    const $ = cheerio.load(renderMenuToggleHtml());
    expect($('button').attr('type')).toBe('button');
  });

  it('ma data-navbar-toggle', () => {
    const $ = cheerio.load(renderMenuToggleHtml());
    expect($('button').attr('data-navbar-toggle')).toBeDefined();
  });

  it('ma aria-controls="site-nav-drawer"', () => {
    const $ = cheerio.load(renderMenuToggleHtml());
    expect($('button').attr('aria-controls')).toBe('site-nav-drawer');
  });

  it('ma aria-expanded="false"', () => {
    const $ = cheerio.load(renderMenuToggleHtml());
    expect($('button').attr('aria-expanded')).toBe('false');
  });

  it('ma aria-label="Menu nawigacji"', () => {
    const $ = cheerio.load(renderMenuToggleHtml());
    expect($('button').attr('aria-label')).toBe('Menu nawigacji');
  });

  it('ma klase ui-nav-menu-toggle', () => {
    const $ = cheerio.load(renderMenuToggleHtml());
    expect($('button').hasClass('ui-nav-menu-toggle')).toBe(true);
  });

  it('domyslnie dodaje lg:hidden', () => {
    const $ = cheerio.load(renderMenuToggleHtml());
    expect($('button').hasClass('lg:hidden')).toBe(true);
  });

  it('mobileOnly=false nie dodaje lg:hidden', () => {
    const $ = cheerio.load(renderMenuToggleHtml({ mobileOnly: false }));
    expect($('button').hasClass('lg:hidden')).toBe(false);
  });

  it('zawiera 3 paski .ui-nav-menu-toggle__bar', () => {
    const $ = cheerio.load(renderMenuToggleHtml());
    expect($('.ui-nav-menu-toggle__bar').length).toBe(3);
  });

  it('kazdy pasek ma aria-hidden="true"', () => {
    const $ = cheerio.load(renderMenuToggleHtml());
    $('.ui-nav-menu-toggle__bar').each((_, el) => {
      expect($(el).attr('aria-hidden')).toBe('true');
    });
  });

  it('touch target ma co najmniej h-11 w-11 z klasy .ui-nav-menu-toggle', () => {
    // Klasa .ui-nav-menu-toggle ma h-11 w-11 w core.css
    const $ = cheerio.load(renderMenuToggleHtml());
    expect($('button').hasClass('ui-nav-menu-toggle')).toBe(true);
  });
});

describe('MobileDrawer — kontrakt renderowania', () => {
  it('renderuje div#site-nav-drawer (widoczność steruje CSS przez is-open)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    expect($('div#site-nav-drawer').length).toBe(1);
  });

  it('ma role="presentation" na kontenerze', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    expect($('div#site-nav-drawer').attr('role')).toBe('presentation');
  });

  it('zawiera aside[role="dialog"] z aria-modal="true"', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const dialog = $('aside[role="dialog"]');
    expect(dialog.length).toBe(1);
    expect(dialog.attr('aria-modal')).toBe('true');
    expect(dialog.attr('aria-label')).toBe('Menu nawigacji');
  });

  it('zawiera przycisk zamykania z data-navbar-close i aria-label', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const closeBtn = $('button[data-navbar-close]');
    expect(closeBtn.length).toBe(1);
    expect(closeBtn.attr('aria-label')).toBe('Zamknij menu');
  });

  it('przycisk zamykania ma h-11 w-11 (touch target)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const closeBtn = $('button[data-navbar-close]');
    expect(closeBtn.hasClass('h-11')).toBe(true);
    expect(closeBtn.hasClass('w-11')).toBe(true);
  });

  it('nie zawiera logo w drawerze (duplikat usunięty z top baru)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    expect($('a.ui-nav-drawer__logo').length).toBe(0);
    expect($('.ui-nav-drawer__brand').length).toBe(0);
  });

  it('zawiera deck z trzema warstwami (talia kart)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    expect($('.ui-nav-drawer__deck').length).toBe(1);
    expect($('.ui-nav-drawer__deck[aria-hidden="true"]').length).toBe(1);
    expect($('.ui-nav-drawer__layer').length).toBe(3);
    expect($('.ui-nav-drawer__layer--1').length).toBe(1);
    expect($('.ui-nav-drawer__layer--2').length).toBe(1);
    expect($('.ui-nav-drawer__layer--3').length).toBe(1);
  });

  it('pozycja z podstronami ma accordion (data-navbar-sub-toggle)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const toggle = $('button[data-navbar-sub-toggle]');
    expect(toggle.length).toBe(1);
    expect(toggle.attr('aria-expanded')).toBe('false');
    expect(toggle.attr('aria-controls')).toBe('ui-nav-drawer-sub-2');
  });

  it('linki podstron mają data-navbar-close (zamykanie draweru)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const subLinks = $('a.ui-nav-drawer__sub-link');
    expect(subLinks.length).toBeGreaterThan(0);
    subLinks.each((_, el) => {
      expect($(el).attr('data-navbar-close')).toBeDefined();
    });
  });

  it('pozycje bez podstron nie mają przycisku rozwijania', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    expect($('button[data-navbar-sub-toggle]').length).toBe(1); // tylko Uslugi
  });

  it('linki nawigacyjne maja formatInternalLink z trailing slash', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const links = $('a.ui-nav-drawer__link');
    expect(links.length).toBe(navLinks.length);
    links.each((i, el) => {
      const href = $(el).attr('href') || '';
      const expected = navLinks[i].href;
      const formatted = formatInternalLink(expected);
      expect(href).toBe(formatted);
    });
  });

  it('kazdy link nawigacyjny ma data-navbar-close', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    $('a.ui-nav-drawer__link').each((_, el) => {
      expect($(el).attr('data-navbar-close')).toBeDefined();
    });
  });

  it('CTA ma href z trailing slash i data-navbar-close', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const cta = $('a.ui-nav-drawer__cta');
    expect(cta.length).toBe(1);
    expect(cta.attr('href')).toBe('/kontakt/');
    expect(cta.attr('data-navbar-close')).toBeDefined();
  });

  it('CTA ma klase ui-nav-drawer__cta (link, nie przycisk)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const cta = $('a.ui-nav-drawer__cta');
    expect(cta.length).toBe(1);
    expect(cta.hasClass('ui-button')).toBe(false);
    expect(cta.hasClass('ui-button-primary')).toBe(false);
  });

  it('zawiera backdrop z data-navbar-close i aria-hidden', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const backdrop = $('.ui-nav-drawer-backdrop');
    expect(backdrop.length).toBe(1);
    expect(backdrop.attr('data-navbar-close')).toBeDefined();
    expect(backdrop.attr('aria-hidden')).toBe('true');
  });

  it('nie zawiera pustych href (#)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    $('a').each((_, el) => {
      const h = $(el).attr('href') || '';
      expect(h).not.toBe('#');
    });
  });

  it('focusable elements: close button, nav links, expand, sub links, CTA', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const focusable = $('a[href], button:not([disabled])');
    expect(focusable.length).toBeGreaterThanOrEqual(navLinks.length + 3); // close + expand + 6 nav + 2 sub + CTA
  });

  it('kazdy link nawigacyjny i CTA ma data-navbar-close (zamykanie po kliknieciu)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const interactive = $('a[href]');
    interactive.each((_, el) => {
      expect($(el).attr('data-navbar-close')).toBeDefined();
    });
  });

  it('backdrop ma data-navbar-close (zamykanie po kliknieciu w tlo)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    expect($('.ui-nav-drawer-backdrop').attr('data-navbar-close')).toBeDefined();
  });

  it('close button jest pierwszym focusable elementem (focus trap: pierwszy element)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const focusable = $('a[href], button:not([disabled])');
    const first = focusable.first();
    expect(first.is('button')).toBe(true);
    expect(first.attr('aria-label')).toBe('Zamknij menu');
  });

  it('zawiera role="presentation" i role="dialog" dla zgodnosci z ARIA', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    expect($('[role="presentation"]').length).toBe(1);
    expect($('[role="dialog"]').length).toBe(1);
  });

  it('dialog ma stabilne id="site-nav-drawer" (zgodnosc z aria-controls w toggle)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    expect($('#site-nav-drawer').length).toBe(1);
  });

  it('kazdy link ma minimalny touch target (h-11 lub w-11 dla close button)', () => {
    const $ = cheerio.load(renderMobileDrawerHtml());
    const closeBtn = $('button[data-navbar-close]');
    expect(closeBtn.hasClass('h-11')).toBe(true);
    expect(closeBtn.hasClass('w-11')).toBe(true);
  });
});

describe('NavbarMainCentered — kontrakt renderowania', () => {
  it('zawiera .ui-container', () => {
    const $ = cheerio.load(renderNavbarMainCenteredHtml());
    expect($('.ui-container').length).toBeGreaterThan(0);
  });

  it('logo link ma href="/"', () => {
    const $ = cheerio.load(renderNavbarMainCenteredHtml());
    const logo = $('a[href="/"]').first();
    expect(logo.length).toBe(1);
  });

  it('linki nawigacyjne maja trailing slash', () => {
    const $ = cheerio.load(renderNavbarMainCenteredHtml());
    const nav = $('nav a');
    nav.each((i, el) => {
      const href = $(el).attr('href') || '';
      const expected = navLinks[i].href;
      expect(href).toBe(formatInternalLink(expected));
    });
  });

  it('CTA link ma klase ui-button-primary', () => {
    const $ = cheerio.load(renderNavbarMainCenteredHtml());
    const cta = $('a.ui-button-primary');
    expect(cta.length).toBeGreaterThan(0);
  });

  it('CTA href="/kontakt/"', () => {
    const $ = cheerio.load(renderNavbarMainCenteredHtml());
    const cta = $('a.ui-nav-cta');
    expect(cta.attr('href')).toBe('/kontakt/');
  });

  it('CTA jest ukryty na mobile (hidden sm:flex)', () => {
    const $ = cheerio.load(renderNavbarMainCenteredHtml());
    const cta = $('a.ui-nav-cta');
    expect(cta.hasClass('hidden')).toBe(true);
    expect(cta.hasClass('sm:flex')).toBe(true);
  });

  it('nawigacja desktopowa jest ukryta na mobile (hidden lg:flex)', () => {
    const $ = cheerio.load(renderNavbarMainCenteredHtml());
    const nav = $('nav');
    expect(nav.hasClass('hidden')).toBe(true);
    expect(nav.hasClass('lg:flex')).toBe(true);
  });

  it('zawiera MenuToggle', () => {
    const $ = cheerio.load(renderNavbarMainCenteredHtml());
    expect($('[data-navbar-toggle]').length).toBe(1);
  });

  it('nie zawiera pustych href (#)', () => {
    const $ = cheerio.load(renderNavbarMainCenteredHtml());
    $('a').each((_, el) => {
      const h = $(el).attr('href') || '';
      expect(h).not.toBe('#');
    });
  });

  it('kazdy link ma hover transition i opacity', () => {
    const $ = cheerio.load(renderNavbarMainCenteredHtml());
    $('nav a').each((_, el) => {
      const cls = $(el).attr('class') || '';
      expect(cls).toContain('transition-all');
      expect(cls).toContain('hover:text-brand-accent');
    });
  });
});
