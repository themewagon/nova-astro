import { describe, expect, it } from 'vitest';
import { PageConfigSchema, PageSectionSchema, SectionDataSchema } from './data-contracts';

describe('data contracts', () => {
  it('akceptuje konfigurację strony z dodatkowymi polami', () => {
    const result = PageConfigSchema.safeParse({
      heading: 'Strona główna',
      seo: {
        title: 'Strona główna',
        description: 'Opis strony',
      },
      sections: [{ id: 'hero', variant: 'default' }],
      customField: { source: 'json' },
    });

    expect(result.success).toBe(true);
  });

  it('wymaga identyfikatora i wariantu sekcji', () => {
    expect(PageSectionSchema.safeParse({ id: 'hero' }).success).toBe(false);
    expect(PageSectionSchema.safeParse({ variant: 'default' }).success).toBe(false);
  });

  it('wymaga obiektu dla danych sekcji', () => {
    expect(SectionDataSchema.safeParse({ title: 'Hero' }).success).toBe(true);
    expect(SectionDataSchema.safeParse(['hero']).success).toBe(false);
  });
});
