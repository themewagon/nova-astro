import type { SectionEntry } from './types';

const icon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>';

export const portfolioSections: Record<string, SectionEntry> = {
  portfolio: {
    id: 'portfolio', label: 'Portfolio', groupId: 'portfolio', hint: 'Prezentacja prac', icon,
    defaultVariant: 'bento',
    variants: {
      bento: { component: 'PortfolioBentoBlock', dataKey: 'portfolio' },
      nova: { label: 'Realizacje z kartami projektów', component: 'ProjectsBlock', dataKey: 'nova-projects' },
      carousel: { component: 'PortfolioCarouselBlock', dataKey: 'portfolio' },
      categorized: { component: 'PortfolioCategorizedBlock', dataKey: 'portfolio' },
      marquee: { component: 'PortfolioMarqueeBlock', dataKey: 'portfolio' },
      'double-marquee': { component: 'PortfolioDoubleMarqueeBlock', dataKey: 'portfolio' },
      masonry: { component: 'PortfolioMasonryBlock', dataKey: 'portfolio' },
    },
  },
  gallery: {
    id: 'gallery', label: 'Galeria', groupId: 'portfolio', hint: 'Galeria zdjęć z miniaturkami i lightboxem', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'GalleryBlock', dataKey: 'gallery' } },
  },
  galleryCrossfade: {
    id: 'galleryCrossfade', label: 'Galeria z przejściami', groupId: 'portfolio', hint: 'Galeria z crossfade, miniaturkami i licznikiem', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'GalleryCrossfadeBlock', dataKey: 'gallery-crossfade' } },
  },
  marqueeWall: {
    id: 'marqueeWall', label: 'Ściana zdjęć', groupId: 'portfolio', hint: 'Marquee z rzędami zdjęć', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'MarqueeImageWallBlock', dataKey: 'marquee-image-wall' } },
  },
};
