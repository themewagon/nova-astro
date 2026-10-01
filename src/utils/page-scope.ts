// Why: logika scope stron wyciagnieta z [...page].astro getStaticPaths.
// Testowalna, reuzywalna, eliminuje duplikacje isAllowed miedzy plikami.

import { HERO_SECTION_IDS } from "@config/hero-ids";

/**
 * Sprawdza czy slug strony jest dozwolony wg BUILD_SCOPE.pages.
 * Root '/' pasuje tylko do '/', pozostale wpisy to prefiksy.
 */
export function isPageAllowed(slug: string, allowedPages: string[]): boolean {
  const allowAll = !allowedPages || allowedPages.length === 0;
  if (allowAll) return true;
  const pathname = slug === "index" ? "/" : `/${slug}/`;
  return allowedPages.some((p) => {
    const normalized = p.endsWith("/") ? p : `${p}/`;
    if (normalized === "/") return pathname === "/";
    return pathname === normalized || pathname.startsWith(normalized);
  });
}

/**
 * Sprawdza czy sekcje zawieraja hero wymagajace fullBleedTop.
 */
export function hasHeroSection(sectionIds: string[]): boolean {
  return sectionIds.some((id) => (HERO_SECTION_IDS as readonly string[]).includes(id));
}

/**
 * Wylicza fullBleedTop dla Layout na podstawie wariantu navbaru i listy sekcji.
 */
export function getFullBleedTop(
  navbarVariant: string | undefined,
  sectionIds: string[],
): boolean {
  return navbarVariant === "floating" && hasHeroSection(sectionIds);
}
