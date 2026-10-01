import type { SectionEntry } from './section-registry/types';
import { shellSections } from './section-registry/shell';
import { heroSections } from './section-registry/hero';
import { aboutSections } from './section-registry/about';
import { servicesSections } from './section-registry/services';
import { portfolioSections } from './section-registry/portfolio';
import { processSections } from './section-registry/process';
import { socialSections } from './section-registry/social';
import { faqSections } from './section-registry/faq';
import { contactSections } from './section-registry/contact';
import { ctaSections } from './section-registry/cta';
import { contentSections } from './section-registry/content';

export { SECTION_GROUPS } from './section-registry/types';
export type { SectionEntry, SectionGroup, VariantEntry } from './section-registry/types';

export const SECTION_REGISTRY: Record<string, SectionEntry> = {
  ...shellSections,
  ...heroSections,
  ...aboutSections,
  ...servicesSections,
  ...portfolioSections,
  ...processSections,
  ...socialSections,
  ...faqSections,
  ...contactSections,
  ...ctaSections,
  ...contentSections,
};
