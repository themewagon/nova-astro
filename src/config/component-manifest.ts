import type { BlockCategory } from './types';

export type BlockClassificationStatus = 'confirmed' | 'provisional';

export type ComponentManifestEntry = {
  category: BlockCategory;
  status: BlockClassificationStatus;
  path?: string;
};

export function getComponentPath(name: string, entry: ComponentManifestEntry): string {
  return entry.path ?? `/src/components/registry/${name}.astro`;
}

/** Public blocks included in the Nova template package. */
export const COMPONENT_MANIFEST: Record<string, ComponentManifestEntry> = {
  AboutBlock: { category: 'core', status: 'provisional' },
  AboutExpertBlock: { category: 'core', status: 'provisional' },
  AboutMarqueeSplitBlock: { category: 'core', status: 'provisional' },
  AboutSplitBlock: { category: 'core', status: 'provisional' },
  AboutSplitLeanBlock: { category: 'core', status: 'provisional' },
  TeamBlock: { category: 'core', status: 'provisional' },
  AudienceSplitBlock: { category: 'core', status: 'provisional' },
  BlogListBlock: { category: 'core', status: 'provisional' },
  CardsFilterableBlock: { category: 'core', status: 'provisional' },
  ContactSplitBlock: { category: 'core', status: 'provisional' },
  CtaBlock: { category: 'core', status: 'provisional' },
  FaqAccordionBlock: { category: 'core', status: 'provisional' },
  FaqFlatBlock: { category: 'core', status: 'provisional' },
  FaqGridBlock: { category: 'core', status: 'provisional' },
  FaqGroupedBlock: { category: 'core', status: 'provisional' },
  FaqLeanBlock: { category: 'core', status: 'provisional' },
  FaqListBlock: { category: 'core', status: 'provisional' },
  FaqSimpleBlock: { category: 'core', status: 'provisional' },
  FaqUpBlock: { category: 'core', status: 'provisional' },
  Faq3Block: { category: 'core', status: 'provisional' },
  TestimonialV2Block: { category: 'core', status: 'provisional' },
  FeatureGridBlock: { category: 'core', status: 'provisional' },
  FeaturesBlock: { category: 'core', status: 'provisional' },
  FeaturesGridBlock: { category: 'core', status: 'provisional' },
  FeaturesOfferCardsBlock: { category: 'core', status: 'provisional' },
  FooterColumnsBlock: { category: 'core', status: 'provisional' },
  FooterMinimalBlock: { category: 'core', status: 'provisional' },
  FooterPromoBlock: { category: 'core', status: 'provisional' },
  NovaFooterBlock: { category: 'core', status: 'provisional' },
  GalleryBlock: { category: 'core', status: 'provisional' },
  GalleryCrossfadeBlock: { category: 'core', status: 'provisional' },
  HeroEditorialBlock: { category: 'core', status: 'provisional' },
  HeroPhotoBlock: { category: 'core', status: 'provisional' },
  HeroBlock: { category: 'core', status: 'provisional' },
  NovaHeroResponsiveBlock: { category: 'core', status: 'confirmed' },
  HeroSplitBlock: { category: 'core', status: 'provisional' },
  HeroStatsBlock: { category: 'core', status: 'provisional' },
  HeroVideoBlock: { category: 'core', status: 'provisional' },
  LogoGridBlock: { category: 'core', status: 'provisional' },
  MarqueeBlock: { category: 'core', status: 'provisional' },
  MarqueeImageWallBlock: { category: 'core', status: 'provisional' },
  PageIntroBlock: { category: 'core', status: 'provisional' },
  PortfolioBentoBlock: { category: 'core', status: 'provisional' },
  ProjectsBlock: { category: 'core', status: 'provisional' },
  PortfolioCarouselBlock: { category: 'core', status: 'provisional' },
  PortfolioCategorizedBlock: { category: 'core', status: 'provisional' },
  PortfolioDoubleMarqueeBlock: { category: 'core', status: 'provisional' },
  PortfolioMarqueeBlock: { category: 'core', status: 'provisional' },
  PortfolioMasonryBlock: { category: 'core', status: 'provisional' },
  ProcessIconStepsBlock: { category: 'core', status: 'provisional' },
  ProcessTimelineBlock: { category: 'core', status: 'provisional' },
  ProcessTimelineScrollBlock: { category: 'core', status: 'provisional' },
  StepsNumberedBlock: { category: 'core', status: 'provisional' },
  TimelineAlternateBlock: { category: 'core', status: 'provisional' },
  ServicesCardsBlock: { category: 'core', status: 'provisional' },
  ServicesGridBlock: { category: 'core', status: 'provisional' },
  ServicesHomeBlock: { category: 'core', status: 'provisional' },
  ServicesMediaCardsBlock: { category: 'core', status: 'provisional' },
  ServicesZigzagBlock: { category: 'core', status: 'provisional' },
  SpecializationsGridBlock: { category: 'core', status: 'provisional' },
  TrustBarBlock: { category: 'core', status: 'provisional' },
  UspPremiumBlock: { category: 'core', status: 'provisional' },
  TestimonialsMarqueeBlock: { category: 'core', status: 'provisional' },
};

const manifestEntries = Object.entries(COMPONENT_MANIFEST) as [string, ComponentManifestEntry][];

export const COMPONENT_CATEGORIES: Record<BlockCategory, string[]> = {
  core: manifestEntries
    .filter(([, entry]) => entry.category === 'core')
    .map(([name]) => name),
  catalog: manifestEntries
    .filter(([, entry]) => entry.category === 'catalog')
    .map(([name]) => name),
  legacy: manifestEntries
    .filter(([, entry]) => entry.category === 'legacy')
    .map(([name]) => name),
};
