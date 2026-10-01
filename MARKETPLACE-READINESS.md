---
title: Nova marketplace readiness
template: T001
status: release-candidate
date: 2026-09-13
---

# Marketplace readiness

This document describes the preparation status of `T001, Nova` for source template distribution.

## Current distribution model

The current release is a free product entry point. It may be used in unlimited personal and commercial website projects under `LICENSE.md`, and template marketplaces may redistribute the source package under the same license. Future versions, Pro editions and implementation services may be paid and may use different terms.

## Completed stages

### Stage 1, repository audit

- Defined the active template scope: homepage, Polish version, English version and legal pages.
- Confirmed the Astro static build and the `dist/` output path.
- Added the documentation list required by a buyer.

### Stage 2, cleanup and separation

- Removed two unrelated video files from `public/assets/videos/`.
- Added `.marketplaceignore` for local and generated files.
- Added asset guidance and a requirement to replace demonstration materials.

### Stage 3, buyer documentation

- `CUSTOMIZATION.md` explains brand, data, image and token customization.
- `CONTENT-GUIDE.md` explains how to replace Nova demonstration content.
- `DEPLOYMENT.md` explains installation, build and publication.
- `ASSETS-LICENSES.md` explains responsibility for fonts, photographs, icons and other assets.
- `CHANGELOG.md` contains the first release candidate entry.

### Stage 4, license and legal

- `LICENSE.md` contains the Free Release terms, restrictions and third-party dependency guidance.
- Fixed the Polish contact link on legal pages so it does not generate `/pl/pl/#kontakt`.

### Stage 7, QA and source package

- Added `npm run package:marketplace`.
- The script creates `release/t001-nova.zip` using only files saved in the current commit.
- Build, links, images, SEO, section data and Atomic Design checks pass.

## Skipped stages

Stage 5, marketplace sales materials, and stage 6, sales channel selection, were skipped as requested by the project owner.

## Conditions before public sale

1. Replace demonstration photographs, avatars, contact details and copy with owned materials or include confirmed licenses.
2. Manually review the homepage in a browser on mobile and desktop.
3. Confirm the final license wording with a lawyer.
4. Run `npm run build`, `npm run check:links`, `npm run check:seo`, `npm run check:images` and `npm run package:marketplace` after the final change.

## Known release candidate limitations

- The repository still contains the full Starter Kit component library, so it is not a minimal single-page bundle.
- Full `npm run qa` reports existing contract errors in dev route tests and uncommitted hero component changes. They do not block the Nova build, but they must be resolved before claiming full QA compliance.
