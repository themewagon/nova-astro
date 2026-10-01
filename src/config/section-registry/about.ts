import type { SectionEntry } from './types';

const icon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>';

export const aboutSections: Record<string, SectionEntry> = {
  about: {
    id: 'about', label: 'O nas', groupId: 'about', hint: 'Sekcja o firmie z USP lub klasycznym opisem', icon,
    defaultVariant: 'default',
    variants: {
      default: { component: 'UspPremiumBlock', dataKey: 'usp-premium' },
      classic: { component: 'AboutBlock', dataKey: 'about' },
    },
  },
  marquee: {
    id: 'marquee', label: 'Marki i logotypy', groupId: 'trust', hint: 'Karuzela logotypów partnerów', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'MarqueeBlock', dataKey: 'marquee' } },
  },
  trustBar: {
    id: 'trustBar', label: 'Pasek zaufania', groupId: 'trust', hint: 'Liczniki zaufania i logotypy partnerów', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'TrustBarBlock', dataKey: 'trust-bar' } },
  },
  novaTeam: {
    id: 'novaTeam', label: 'Zespół i wartości', groupId: 'about', hint: 'Sekcja zespołu dla templateu Nova', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'TeamBlock', dataKey: 'nova-team' } },
  },
  aboutMarquee: {
    id: 'aboutMarquee', label: 'O nas z marquee', groupId: 'about', hint: 'Split tekstu, zdjęcia i przewijanych pasów', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'AboutMarqueeSplitBlock', dataKey: 'about-marquee' } },
  },
  aboutSplit: {
    id: 'aboutSplit', label: 'O nas ze zdjęciem', groupId: 'about', hint: 'Split tekstu, zdjęcia i cytatu', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'AboutSplitBlock', dataKey: 'about-split' } },
  },
  aboutExpert: {
    id: 'aboutExpert', label: 'Ekspert', groupId: 'about', hint: 'Split z portretem, listą kompetencji i linkiem', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'AboutExpertBlock', dataKey: 'about-expert' } },
  },
  audienceSplit: {
    id: 'audienceSplit', label: 'Dla kogo', groupId: 'about', hint: 'Split z grupami docelowymi', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'AudienceSplitBlock', dataKey: 'audience-split' } },
  },
  aboutSplitLean: {
    id: 'aboutSplitLean', label: 'O nas z obrazem', groupId: 'about', hint: 'Split z obrazem i gradientowym overlay', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'AboutSplitLeanBlock', dataKey: 'about-split-lean' } },
  },
  logoGrid: {
    id: 'logoGrid', label: 'Logotypy', groupId: 'trust', hint: 'Statyczny grid logotypów', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'LogoGridBlock', dataKey: 'logo-grid' } },
  },
};
