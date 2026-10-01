import type { SectionEntry } from './types';

const icon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>';

export const faqSections: Record<string, SectionEntry> = {
  faq: {
    id: 'faq', label: 'FAQ', groupId: 'faq', hint: 'Pytania i odpowiedzi', icon,
    defaultVariant: 'simple',
    variants: {
      simple: { component: 'FaqSimpleBlock', dataKey: 'faq' },
      grid: { component: 'FaqGridBlock', dataKey: 'faq' },
      list: { component: 'FaqListBlock', dataKey: 'faq' },
      grouped: { component: 'FaqGroupedBlock', dataKey: 'faq' },
    },
  },
  faqAccordion: {
    id: 'faqAccordion', label: 'FAQ accordion', groupId: 'faq', hint: 'Accordion z nagłówkiem sekcji', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'FaqAccordionBlock', dataKey: 'faq-accordion' } },
  },
  faqLean: {
    id: 'faqLean', label: 'FAQ plus', groupId: 'faq', hint: 'Accordion z obracanym plusem', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'FaqLeanBlock', dataKey: 'faq-lean' } },
  },
  faqFlat: {
    id: 'faqFlat', label: 'FAQ płaski', groupId: 'faq', hint: 'Płaski FAQ bez accordionu', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'FaqFlatBlock', dataKey: 'faq-flat' } },
  },
  faqUp: {
    id: 'faqUp', label: 'FAQ z CTA', groupId: 'faq', hint: 'Accordion z ikoną pomocy i CTA', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'FaqUpBlock', dataKey: 'faq-up' } },
  },
  faq3: {
    id: 'faq3', label: 'FAQ Nova', groupId: 'faq', hint: 'Nowoczesny accordion dla templateu Nova', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'Faq3Block', dataKey: 'faq3' } },
  },
};
