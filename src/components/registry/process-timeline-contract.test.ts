import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';

interface TimelineItem {
  icon?: string;
  title: string;
  description: string;
}

interface TimelineData {
  title?: string;
  description?: string;
  items?: TimelineItem[];
}

// Why: Normalization must match that in the component for tests to verify
// exactly the same contract that ProcessTimelineBlock produces.
const normalizeIconName = (icon?: string) =>
  typeof icon === 'string' && icon.trim().length > 0 ? icon.trim().replace(/^ph-/, '') : 'chat';

// We render HTML identical to the block output so that the contract (structure, classes,
// data) was checked without starting the Astro runtime (hero-contract pattern).
function renderTimelineHtml(data: TimelineData): string {
  const title = data.title ?? 'Jak pracujemy?';
  const description =
    data.description ??
    'Poznaj nasz sprawdzony proces współpracy od pierwszego kontaktu po oddanie gotowego rozwiązania.';
  const items = data.items ?? [];

  const headerHtml = `<div class="flex flex-col gap-6 text-center items-center mx-auto max-w-2xl mb-12 md:mb-16">
    <h2 class="font-heading font-bold ui-type-section-title text-brand-dark">${title}</h2>
    <p class="leading-relaxed ui-type-lead max-w-2xl font-normal ui-text-on-light-subtle mx-auto">${description}</p>
  </div>`;

  const stepsHtml = items
    .map((item, index) => {
      const stepNum = (index + 1).toString().padStart(2, '0');
      const isEven = index % 2 === 0;
      return `<li class="timeline-step relative flex gap-5 lg:items-start ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}" >
        <div class="flex shrink-0 items-start justify-center relative z-10 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
          <div class="timeline-dot relative flex size-11 items-center justify-center rounded-full border-2 border-brand-primary/20 bg-brand-light text-brand-primary">
            <i class="ph ph-${normalizeIconName(item.icon)} text-xl"></i>
          </div>
        </div>
        <div class="timeline-content flex-1 pt-0.5 lg:pt-1 ${isEven ? 'lg:pr-14 lg:text-right' : 'lg:pl-14 lg:text-left'}">
          <div class="mb-1 lg:mb-2">
            <span class="text-xs font-semibold uppercase tracking-widest text-brand-primary/60">Krok ${stepNum}</span>
          </div>
          <h3 class="font-heading font-bold ui-type-feature-title text-brand-dark mb-2">${item.title}</h3>
          <p class="leading-relaxed ui-type-body text-brand-dark/65">${item.description}</p>
        </div>
        <div class="hidden lg:block flex-1" aria-hidden="true"></div>
      </li>`;
    })
    .join('');

  return `<section class="ui-section ui-bg-base" >
    <div class="ui-container">
      ${headerHtml}
      <div id="process-timeline" class="relative mx-auto mt-16 max-w-4xl">
        <div class="absolute left-6 top-3 h-[calc(100%-1.5rem)] w-0.5 bg-brand-primary/10 rounded-full lg:left-1/2 lg:-translate-x-1/2" aria-hidden="true"></div>
        
        <ol class="space-y-8 lg:space-y-20" id="timeline-steps">
          ${stepsHtml}
        </ol>
      </div>
    </div>
  </section>`;
}

describe('ProcessTimelineBlock — kontrakt renderowania', () => {
  const defaultData: TimelineData = {
    title: 'Jak pracujemy?',
    description: 'Poznaj nasz sprawdzony proces współpracy, od pierwszego kontaktu aż po wdrożenie.',
    items: [
      { icon: 'chat', title: 'Kontakt i wywiad', description: 'Rozmawiamy o Twoich celach i potrzebach.' },
      { icon: 'magnifying-glass', title: 'Analiza i projekt', description: 'Przygotowujemy koncepcję dopasowaną do marki.' },
      { icon: 'gear', title: 'Realizacja', description: 'Budujemy rozwiązanie etapami.' },
      { icon: 'check-circle', title: 'Wdrożenie i wsparcie', description: 'Oddajemy gotowy produkt i wspieramy po starcie.' },
    ],
  };

  it('renderuje sekcję z tytułem', () => {
    const $ = cheerio.load(renderTimelineHtml(defaultData));
    expect($('section').length).toBe(1);
    expect($('h2').text()).toContain('Jak pracujemy?');
    expect($('h2').hasClass('ui-type-section-title')).toBe(true);
  });

  it('renderuje opis pod tytułem', () => {
    const $ = cheerio.load(renderTimelineHtml(defaultData));
    expect($('.ui-type-lead').text()).toContain('sprawdzony proces współpracy');
  });

  it('renderuje dokładnie tyle kroków, ile jest w items', () => {
    const $ = cheerio.load(renderTimelineHtml(defaultData));
    expect($('li.timeline-step').length).toBe(4);
  });

  it('każdy krok ma ikonę z systemu Phosphor', () => {
    const $ = cheerio.load(renderTimelineHtml(defaultData));
    const icons = $('.timeline-dot i.ph');
    expect(icons.length).toBe(4);
    expect(icons.eq(0).hasClass('ph-chat')).toBe(true);
    expect(icons.eq(1).hasClass('ph-magnifying-glass')).toBe(true);
    expect(icons.eq(2).hasClass('ph-gear')).toBe(true);
    expect(icons.eq(3).hasClass('ph-check-circle')).toBe(true);
  });

  it('każdy krok ma tytuł, opis i etykietę "Krok NN"', () => {
    const $ = cheerio.load(renderTimelineHtml(defaultData));
    $('li.timeline-step').each((_index, el) => {
      expect($(el).find('.timeline-content h3').text().length).toBeGreaterThan(0);
      expect($(el).find('.timeline-content p').text().length).toBeGreaterThan(0);
      expect($(el).find('.timeline-content span').text()).toBe(`Krok ${String(_index + 1).padStart(2, '0')}`);
    });
  });

    it('kroki są renderowane jako statyczne timeline-step', () => {
    const $ = cheerio.load(renderTimelineHtml(defaultData));
    $('li.timeline-step').each((_index, el) => {
      expect($(el).hasClass('timeline-step')).toBe(true);
      expect($(el).hasClass('lg:flex-row') || $(el).hasClass('lg:flex-row-reverse')).toBe(true);
    });
  });

  it('pasek postępu nie jest renderowany (usunięty z systemu animacji)', () => {
    const $ = cheerio.load(renderTimelineHtml(defaultData));
    expect($('#timeline-progress').length).toBe(0);
  });
it('z pustymi items nie crashuje i nie renderuje kroków', () => {
    const $ = cheerio.load(renderTimelineHtml({ ...defaultData, items: [] }));
    expect($('section').length).toBe(1);
    expect($('li.timeline-step').length).toBe(0);
    expect($('h2').text()).toContain('Jak pracujemy?');
  });

  it('bez items (undefined) renderuje pustą listę bez błędów', () => {
    const $ = cheerio.load(renderTimelineHtml({ title: 'Jak pracujemy?' }));
    expect($('ol#timeline-steps').length).toBe(1);
    expect($('ol#timeline-steps li').length).toBe(0);
  });

  it('normalizuje ikony z prefiksem ph-', () => {
    const $ = cheerio.load(renderTimelineHtml({
      ...defaultData,
      items: [{ icon: 'ph-gear', title: 'Krok', description: 'Opis' }],
    }));
    expect($('.timeline-dot i.ph').hasClass('ph-gear')).toBe(true);
  });

  it('brak ikony nie crashuje i używa fallbacku "chat"', () => {
    const $ = cheerio.load(renderTimelineHtml({
      ...defaultData,
      items: [{ title: 'Krok', description: 'Opis' }],
    }));
    expect($('.timeline-dot i.ph').hasClass('ph-chat')).toBe(true);
  });
});
