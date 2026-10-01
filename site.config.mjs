// Single source of truth for site / client project configuration.
// Edit THIS file when changing domain.
// Environment domain used during build.
export const SITE_URL = 'https://webscale.pl/preview/nova/';
export const ACTIVE_TEMPLATE = 'nova';

// Nova currently ships English and Polish routes. SITE_LOCALE selects the
// default locale for shared pages; the homepage language switcher remains active.
export const SITE_LOCALE = 'en';

// BUILD_SCOPE — what goes into build (dist/) and what stays dev-only.
// Dev has everything (for prototyping), build is clean per project scope.
// Example one-page: pages: ['/', '/pl'] keeps only homepage
// (EN + PL) + 404, removes other subpages (blog, contact, services...).
export const BUILD_SCOPE = {
  // Allowlist of paths to keep in build. Empty [] = all.
  // Prefix works: '/pl' keeps '/pl/', '/pl/cookies/' etc.
  // 404 is always kept regardless of this list.
  pages: ['/', '/pl', '/cookies', '/polityka-prywatnosci'],
  // Denylist — always removed from dist/ (dev-only, prototypes, demo).
  // Entry matches by first path segment. Dev and QA stay out of production build.
  forceRemove: ['starwind-demo', 'layout-test', 'roofing', 'dev', 'qa'],
  // Whether to clean unused media (images, videos, fonts) from dist/.
  images: true,
};
