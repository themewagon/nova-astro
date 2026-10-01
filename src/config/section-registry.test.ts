import { describe, expect, it } from 'vitest';
import { SECTION_GROUPS, SECTION_REGISTRY } from './section-registry';
import { aboutSections } from './section-registry/about';
import { contactSections } from './section-registry/contact';
import { contentSections } from './section-registry/content';
import { ctaSections } from './section-registry/cta';
import { faqSections } from './section-registry/faq';
import { heroSections } from './section-registry/hero';
import { portfolioSections } from './section-registry/portfolio';
import { processSections } from './section-registry/process';
import { servicesSections } from './section-registry/services';
import { shellSections } from './section-registry/shell';
import { socialSections } from './section-registry/social';

const domainRegistries = [
  shellSections,
  heroSections,
  aboutSections,
  servicesSections,
  portfolioSections,
  processSections,
  socialSections,
  faqSections,
  contactSections,
  ctaSections,
  contentSections,
];

describe('section registry domains', () => {
  it('nie zawiera zduplikowanych identyfikatorów bloków', () => {
    const keys = domainRegistries.flatMap((registry) => Object.keys(registry));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('zachowuje wszystkie domenowe wpisy w publicznym registry', () => {
    const keys = domainRegistries.flatMap((registry) => Object.keys(registry));

    expect(Object.keys(SECTION_REGISTRY)).toHaveLength(keys.length);
    expect(new Set(Object.keys(SECTION_REGISTRY))).toEqual(new Set(keys));
  });

  it('rozdziela elementy shellu na motyw, menu i stopkę', () => {
    const groupsById = new Map(SECTION_GROUPS.map((group) => [group.id, group.label]));

    expect(groupsById.get('theme')).toBe('Motyw');
    expect(groupsById.get('navbar')).toBe('Menu');
    expect(groupsById.get('footer')).toBe('Footer');
    expect(Object.values(shellSections).filter((entry) => entry.groupId === 'shell')).toHaveLength(0);
  });
});
