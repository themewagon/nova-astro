import type { SectionEntry } from './types';

const icon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>';

export const contactSections: Record<string, SectionEntry> = {
  contact: {
    id: 'contact', label: 'Kontakt', groupId: 'contact', hint: 'Formularz kontaktowy z danymi', icon,
    defaultVariant: 'default',
    variants: {
      default: { component: 'ContactSplitBlock', props: { variant: 'default' }, dataKey: 'contact' },
      split: { component: 'ContactSplitBlock', props: { variant: 'split' }, dataKey: 'contact' },
      map: { component: 'ContactSplitBlock', props: { variant: 'map' }, dataKey: 'contact' },
      simple: { component: 'ContactSplitBlock', props: { variant: 'simple' }, dataKey: 'contact' },
    },
  },
};
