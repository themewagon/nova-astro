import { describe, expect, it } from 'vitest';
import { auditPageConfig, auditRegistryDefaults } from '@utils/page-registry-audit';

const registry = {
  navbar: { id: 'navbar', defaultVariant: 'centered', variants: { centered: { component: 'Navbar' } } },
  footer: { id: 'footer', defaultVariant: 'columns', variants: { columns: { component: 'Footer' } } },
  faq: { id: 'faq', defaultVariant: 'flat', variants: { flat: { component: 'Faq', dataKey: 'faq' } } },
};

const options = {
  registry,
  sectionDataKeys: new Set(['faq']),
  componentNames: new Set(['Navbar', 'Footer', 'Faq']),
};

describe('page registry audit', () => {
  it('accepts a valid page config', () => {
    expect(auditPageConfig('index.json', {
      heading: 'Firma',
      sections: [
        { id: 'navbar', variant: 'centered' },
        { id: 'faq', variant: 'flat' },
        { id: 'footer', variant: 'columns' },
      ],
    }, options)).toEqual([]);
  });

  it('detects invalid section ids and variants', () => {
    const errors = auditPageConfig('bad.json', {
      heading: 'Firma',
      sections: [{ id: 'hero', variant: 'missing' }],
    }, options);
    expect(errors).toContain('bad.json: unknown section id "hero".');
    expect(errors).toContain('bad.json: expected exactly one navbar, found 0.');
  });

  it('detects missing h1 source, data and component mappings', () => {
    const errors = auditPageConfig('bad.json', {
      sections: [
        { id: 'navbar', variant: 'centered' },
        { id: 'faq', variant: 'flat' },
        { id: 'footer', variant: 'columns' },
      ],
    }, { ...options, sectionDataKeys: new Set() });
    expect(errors).toContain('bad.json: heading is required to render exactly one page h1.');
    expect(errors).toContain('bad.json: faq.flat references missing dataKey "faq".');
  });

  it('checks registry default variants', () => {
    expect(auditRegistryDefaults({
      broken: { id: 'broken', defaultVariant: 'missing', variants: {} },
    })).toEqual([
      'registry: broken has no valid defaultVariant.',
      'registry: broken has no variants.',
    ]);
  });
});
