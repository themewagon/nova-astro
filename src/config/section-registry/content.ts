import type { SectionEntry } from './types';

const icon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>';

export const contentSections: Record<string, SectionEntry> = {
  blog: {
    id: 'blog', label: 'Blog', groupId: 'content', hint: 'Lista ostatnich wpisów bloga', icon,
    defaultVariant: 'list',
    variants: { list: { component: 'BlogListBlock' } },
  },
  pageIntro: {
    id: 'pageIntro', label: 'Wprowadzenie podstrony', groupId: 'content', hint: 'Minimalny nagłówek podstrony', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'PageIntroBlock' } },
  },
};
