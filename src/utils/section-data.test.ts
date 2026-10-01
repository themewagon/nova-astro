import { describe, expect, it } from 'vitest';
import { createSectionDataCache, getSectionDataKey, type SectionJsonModule } from './section-data';

describe('createSectionDataCache', () => {
  it('obsługuje dane z podkatalogu bez zmiany dataKey', () => {
    expect(getSectionDataKey('/src/data/sections/clients/legacy/hero.json')).toBe('hero');
  });

  it('mapuje dane JSON po nazwie pliku', () => {
    const modules: Record<string, SectionJsonModule> = {
      '/src/data/sections/hero-split.json': {
        default: { title: 'Hero' },
      },
    };

    expect(createSectionDataCache(modules)).toEqual({
      'hero-split': { title: 'Hero' },
    });
  });

  it('pomija moduły bez obiektu danych', () => {
    const modules: Record<string, SectionJsonModule> = {
      '/src/data/sections/empty.json': { default: null },
      '/src/data/sections/list.json': { default: ['item'] },
    };

    expect(createSectionDataCache(modules)).toEqual({});
  });

  it('obsługuje moduł bez pola default', () => {
    const modules: Record<string, SectionJsonModule> = {
      '/src/data/sections/contact.json': { title: 'Kontakt' },
    };

    expect(createSectionDataCache(modules)).toEqual({
      contact: { title: 'Kontakt' },
    });
  });

  it('zgłasza konflikt, gdy dwa pliki mają ten sam dataKey', () => {
    const modules: Record<string, SectionJsonModule> = {
      '/src/data/sections/core/hero.json': { default: { title: 'Core' } },
      '/src/data/sections/clients/legacy/hero.json': { default: { title: 'Legacy' } },
    };

    expect(() => createSectionDataCache(modules)).toThrow('Duplicate section data key "hero"');
  });
});
