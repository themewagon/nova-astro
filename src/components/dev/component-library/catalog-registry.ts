import { SECTION_GROUPS, SECTION_REGISTRY } from '@config/section-registry';
import decorationCatalog from '@data/dev/component-library/decoration-catalog.json';
import uiCatalog from '@data/dev/component-library/ui-catalog.json';

export type DeveloperCatalogType = 'section' | 'ui' | 'pattern' | 'decoration';

export type DeveloperCatalogGroup = {
  id: string;
  label: string;
};

export type DeveloperCatalogMetadata = {
  uid: number;
  catalogType: DeveloperCatalogType;
  sectionId: string;
  sectionLabel: string;
  groupId: string;
  groupLabel: string;
  variantId: string;
  variantLabel?: string;
  componentName: string;
  hint?: string;
  previewId?: string;
};

const groupLabels = Object.fromEntries(SECTION_GROUPS.map((group) => [group.id, group.label]));

/**
 * Builds a lightweight metadata catalog without importing Astro components.
 * This layer is used by the thumbnail gallery, so it should not load the component map.
 */
export function getDeveloperCatalogMetadata(): DeveloperCatalogMetadata[] {
  const items: DeveloperCatalogMetadata[] = [];

  Object.values(SECTION_REGISTRY).forEach((entry) => {
    if (entry.id === 'theme') return;

    Object.entries(entry.variants).forEach(([variantId, variant]) => {
      if (!variant.component) return;

      items.push({
        uid: items.length + 1,
        catalogType: 'section',
        sectionId: entry.id,
        sectionLabel: entry.label,
        groupId: entry.groupId,
        groupLabel: groupLabels[entry.groupId] || entry.groupId,
        variantId,
        variantLabel: variant.label,
        componentName: variant.component,
        hint: entry.hint,
      });
    });
  });

  uiCatalog.items.forEach((item) => {
    items.push({
      uid: items.length + 1,
      catalogType: item.catalogType as DeveloperCatalogType,
      sectionId: item.id,
      sectionLabel: item.label,
      groupId: item.groupId,
      groupLabel: uiCatalog.groups.find((group) => group.id === item.groupId)?.label || item.groupId,
      variantId: item.variantId,
      componentName: item.componentName,
      hint: item.hint,
      previewId: item.previewId,
    });
  });

  decorationCatalog.items.forEach((item) => {
    items.push({
      uid: items.length + 1,
      catalogType: 'decoration',
      sectionId: item.id,
      sectionLabel: item.label,
      groupId: item.groupId,
      groupLabel: decorationCatalog.groups.find((group) => group.id === item.groupId)?.label || item.groupId,
      variantId: item.variantId,
      componentName: item.componentName,
      hint: item.hint,
      previewId: item.previewId,
    });
  });

  return items;
}

export function getDeveloperCatalogGroups(): DeveloperCatalogGroup[] {
  return [
    ...SECTION_GROUPS,
    ...uiCatalog.groups,
    ...decorationCatalog.groups,
  ];
}
