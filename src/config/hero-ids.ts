// Why: One source of truth for hero sections requiring fullBleedTop.
// Used in PageBuilder.astro (hasHeroSection) and [...page].astro (fullBleedTop).
// The change here propagates automatically, no constant duplication.

export const HERO_SECTION_IDS = ["hero", "heroSplit"] as const;

export type HeroSectionId = (typeof HERO_SECTION_IDS)[number];

// Auxiliary checker used in PageBuilder and [...page]
export function isHeroSection(id: string): boolean {
  return (HERO_SECTION_IDS as readonly string[]).includes(id);
}
