import type { SectionEntry } from './types';

const icon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>';

export const shellSections: Record<string, SectionEntry> = {
  theme: {
    id: 'theme', label: 'Theme', groupId: 'theme', hint: 'Globalny motyw kolorystyczny', icon,
    defaultVariant: 'default',
    variants: { default: { component: null } },
  },
  navbar: {
    id: 'navbar', label: 'Navbar', groupId: 'navbar', hint: 'Układ menu głównego', icon,
    defaultVariant: 'floating',
    variants: {
      centered: { component: 'Navbar', props: { layout: 'centered' } },
      floating: { component: 'Navbar', props: { layout: 'floating' } },
      local: { component: 'Navbar', props: { layout: 'local' } },
      plain: { component: 'Navbar', props: { layout: 'plain' } },
    },
  },
  footer: {
    id: 'footer', label: 'Footer', groupId: 'footer', hint: 'Wariant stopki', icon,
    defaultVariant: 'nova',
    variants: {
      columns: { component: 'FooterColumnsBlock' },
      minimal: { component: 'FooterMinimalBlock' },
      promo: { component: 'FooterPromoBlock' },
      nova: { component: 'NovaFooterBlock' },
    },
  },
};
