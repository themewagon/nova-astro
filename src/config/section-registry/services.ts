import type { SectionEntry } from './types';

const icon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>';

export const servicesSections: Record<string, SectionEntry> = {
  features: {
    id: 'features', label: 'Usługi', groupId: 'services', hint: 'Sekcja usług z kartami ikon', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'FeaturesBlock', dataKey: 'features' } },
  },
  novaServices: {
    id: 'novaServices', label: 'Oferta usług', groupId: 'services', hint: 'Autorska sekcja usług dla templateu Nova', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'ServicesHomeBlock', dataKey: 'nova-services' } },
  },
  featuresOffer: {
    id: 'featuresOffer', label: 'Karty ofert', groupId: 'services', hint: 'Karty ofert z numeracją i wyróżnieniem', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'FeaturesOfferCardsBlock', dataKey: 'features-offer' } },
  },
  specializationsGrid: {
    id: 'specializationsGrid', label: 'Specjalizacje', groupId: 'services', hint: 'Grid obszarów specjalizacji', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'SpecializationsGridBlock', dataKey: 'specializations-grid' } },
  },
  servicesZigzag: {
    id: 'servicesZigzag', label: 'Usługi zigzag', groupId: 'services', hint: 'Naprzemienne sekcje usług ze zdjęciami', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'ServicesZigzagBlock', dataKey: 'services-zigzag' } },
  },
  servicesGrid: {
    id: 'servicesGrid', label: 'Usługi grid', groupId: 'services', hint: 'Grid kart usług', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'ServicesGridBlock', dataKey: 'services-grid' } },
  },
  servicesCards: {
    id: 'servicesCards', label: 'Karty usług', groupId: 'services', hint: 'Karty usług z ikonami', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'ServicesCardsBlock', dataKey: 'services-cards' } },
  },
  featuresGrid: {
    id: 'featuresGrid', label: 'Features grid', groupId: 'services', hint: 'Grid korzyści', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'FeaturesGridBlock', dataKey: 'features-grid' } },
  },
  filterableCards: {
    id: 'filterableCards', label: 'Karty filtrowane', groupId: 'services', hint: 'Karty z filtrowaniem po kategorii', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'CardsFilterableBlock', dataKey: 'filterable-cards' } },
  },
  featureGrid: {
    id: 'featureGrid', label: 'Feature grid', groupId: 'services', hint: 'Grid funkcji z ikonami', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'FeatureGridBlock', dataKey: 'feature-grid' } },
  },
  servicesMediaCards: {
    id: 'servicesMediaCards', label: 'Usługi z obrazami', groupId: 'services', hint: 'Karty usług z mediami', icon,
    defaultVariant: 'default',
    variants: { default: { component: 'ServicesMediaCardsBlock', dataKey: 'services-media-cards' } },
  },
};
