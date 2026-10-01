import { describe, expect, it } from 'vitest';
import { getDeveloperCatalogGroups, getDeveloperCatalogMetadata } from './catalog-registry';

describe('developer catalog metadata', () => {
  it('keeps UI, Patterns and Decorations in the same catalog as section groups', () => {
    const groups = getDeveloperCatalogGroups();
    const catalog = getDeveloperCatalogMetadata();

    expect(groups.map((group) => group.id)).toEqual(expect.arrayContaining(['hero', 'ui', 'patterns', 'decorations', 'svg-decorations']));
    expect(groups).toEqual(expect.arrayContaining([{ id: 'trust', label: 'Zaufanie' }]));
    expect(catalog.filter((item) => item.catalogType === 'section').length).toBeGreaterThan(0);
    expect(catalog.filter((item) => item.catalogType === 'ui').map((item) => item.sectionId)).toEqual([
      'ui-search-field',
      'ui-select-dropdown',
      'ui-filter-tabs',
    ]);
    expect(catalog.filter((item) => item.catalogType === 'pattern').map((item) => item.sectionId)).toEqual([
      'pattern-toast',
      'pattern-form-field',
      'pattern-form-statuses',
      'pattern-mobile-drawer',
    ]);
    expect(catalog.filter((item) => item.catalogType === 'ui' || item.catalogType === 'pattern').map((item) => item.componentName)).toEqual([
      'SearchField',
      'SelectDropdown',
      'FilterTabs',
      'ToastFeedback',
      'FormField',
      'FormStatus',
      'MobileDrawer',
    ]);
    expect(catalog.filter((item) => item.catalogType === 'decoration').map((item) => item.sectionId).slice(0, 12)).toEqual([
      'decoration-gradient-orb',
      'decoration-blur-glow',
      'decoration-beam-lines',
      'decoration-floating-shapes',
      'decoration-editorial-blobs',
      'decoration-grid-pattern',
      'decoration-pattern-grid',
      'decoration-pattern-noise',
      'decoration-corner-flourish',
      'decoration-ring',
      'decoration-section-wave',
      'decoration-spotlight',
    ]);
    expect(catalog.filter((item) => item.groupId === 'svg-decorations')).toHaveLength(72);
    expect(catalog.every((item) => !('source' in item))).toBe(true);
    expect(catalog.filter((item) => item.groupId === 'trust').map((item) => item.sectionId)).toEqual([
      'marquee',
      'trustBar',
      'logoGrid',
    ]);
    expect(catalog.find((item) => item.sectionId === 'hero' && item.variantId === 'nova')?.variantLabel).toBe('Hero fotograficzny');
    expect(catalog.find((item) => item.sectionId === 'portfolio' && item.variantId === 'nova')?.variantLabel).toBe('Realizacje z kartami projektów');
  });
});
