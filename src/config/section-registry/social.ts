import type { SectionEntry } from './types';

export const socialSections: Record<string, SectionEntry> = {
  testimonials: {
    id: 'testimonials', label: 'Opinie', groupId: 'social', hint: 'Opinie w przewijanym układzie',
    icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke-width="2" stroke-linecap="round"/></svg>',
    defaultVariant: 'marquee',
    variants: {
      marquee: { component: 'TestimonialsMarqueeBlock', dataKey: 'testimonials' },
      v2: { label: 'Opinie w kolumnach', component: 'TestimonialV2Block', dataKey: 'testimonial-v2' },
    },
  },
};
