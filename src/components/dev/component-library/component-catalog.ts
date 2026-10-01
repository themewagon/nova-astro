import { COMPONENT_MAP } from '@config/component-map';
import { SECTION_REGISTRY } from '@config/section-registry';
import { createSectionDataCache, type SectionJsonModule } from '@utils/section-data';
import DecorationCatalogPreview from './DecorationCatalogPreview.astro';
import UiCatalogPreview from './UiCatalogPreview.astro';
import { getDeveloperCatalogMetadata, type DeveloperCatalogMetadata } from './catalog-registry';

export type DeveloperCatalogVariant = DeveloperCatalogMetadata & {
  component: any;
  props: Record<string, unknown>;
};

const dataModules = import.meta.glob<SectionJsonModule>('../../../data/sections/**/*.json', { eager: true });
const sectionDataCache = createSectionDataCache(dataModules);

export function getDeveloperCatalog(): DeveloperCatalogVariant[] {
  return getDeveloperCatalogMetadata().flatMap((metadata) => {
    if (metadata.catalogType !== 'section') {
      return [{
        ...metadata,
        component: metadata.catalogType === 'decoration' ? DecorationCatalogPreview : UiCatalogPreview,
        props: { previewId: metadata.previewId },
      }];
    }

    const entry = SECTION_REGISTRY[metadata.sectionId];
    const variant = entry?.variants[metadata.variantId];
    if (!variant?.component) return [];

    const component = COMPONENT_MAP[variant.component];
    if (!component) return [];

    let props: Record<string, unknown> = { ...(variant.props || {}) };
    if (variant.dataKey) {
      const data = sectionDataCache[variant.dataKey];
      if (data) props = { ...props, ...data };
    }

    return [{
      ...metadata,
      component,
      props,
    }];
  });
}

export function findDeveloperCatalogVariant(
  catalog: DeveloperCatalogVariant[],
  sectionId: string | null,
  variantId: string | null,
): DeveloperCatalogVariant | undefined {
  return catalog.find((item) => (
    item.sectionId === sectionId && item.variantId === variantId
  )) || catalog[0];
}
