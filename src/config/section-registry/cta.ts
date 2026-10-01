import type { SectionEntry } from './types';

const icon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>';

export const ctaSections: Record<string, SectionEntry> = {
  novaCta: {
    id: 'novaCta', label: 'Końcowe wezwanie do działania', groupId: 'cta', hint: 'Końcowe CTA dla templateu Nova', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'CtaBlock', dataKey: 'nova-cta' } },
  },
};
