import type { SectionEntry } from './types';

const icon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>';

export const heroSections: Record<string, SectionEntry> = {
  hero: {
    id: 'hero', label: 'Hero', groupId: 'hero', hint: 'Warianty hero dla stron Nova', icon,
    defaultVariant: 'nova',
    variants: {
      default: { component: 'HeroSplitBlock', dataKey: 'hero-split' },
      nova: { label: 'Hero fotograficzny', component: 'NovaHeroResponsiveBlock', dataKey: 'nova-hero-wireframe' },
      legacyNova: { label: 'Hero Nova legacy', component: 'HeroBlock', dataKey: 'nova-hero-wireframe' },
    },
  },
  heroVideo: {
    id: 'heroVideo', label: 'Hero z wideo', groupId: 'hero', hint: 'Hero z wideo w tle', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'HeroVideoBlock', dataKey: 'hero-video' } },
  },
  heroEditorial: {
    id: 'heroEditorial', label: 'Hero editorialny', groupId: 'hero', hint: 'Hero z blobami, etykietami i karuzelą', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'HeroEditorialBlock', dataKey: 'hero-editorial' } },
  },
  heroPhoto: {
    id: 'heroPhoto', label: 'Hero ze zdjęciem', groupId: 'hero', hint: 'Pełnoekranowe hero ze zdjęciem i logotypami', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'HeroPhotoBlock', dataKey: 'hero-photo' } },
  },
  heroStats: {
    id: 'heroStats', label: 'Hero ze statystykami', groupId: 'hero', hint: 'Hero z leadem i paskiem statystyk', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'HeroStatsBlock', dataKey: 'hero-stats' } },
  },
};
