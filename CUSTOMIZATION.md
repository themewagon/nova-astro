# Nova, customization guide

This guide explains the safest way to adapt Nova for a new brand.

## Start here

```bash
npm ci
npm run dev
```

The homepage is assembled from JSON data. Change content in `src/data`, not directly in Astro components.

## Brand and company data

Update:

```text
src/data/global/company.json
src/data/global/seo.json
site.config.mjs
```

Use `company.json` for company details, branding and social links. Use `seo.json` for page titles, descriptions and indexing settings. Nova's homepage navigation, language switcher and footer are driven by `src/data/i18n/nova.json`; the generic navigation JSON files apply to the other shared layouts, not Nova's homepage shell.

## Homepage content

The Nova homepage uses the following files:

```text
src/data/i18n/nova.json
src/data/sections/nova-hero-wireframe.json
src/data/sections/nova-projects.json
src/data/sections/nova-services.json
src/data/sections/nova-team.json
src/data/sections/faq3.json
src/data/sections/testimonial-v2.json
src/data/sections/nova-cta.json
```

Update both language objects in `src/data/i18n/nova.json` when changing homepage copy.
For Nova's localized homepage, this file overrides the matching section content at render time. The `src/data/sections/*.json` files remain useful for generic block previews and fallbacks, but editing them alone does not change Nova's English or Polish homepage copy.

## Images

Replace the files in `public/assets/images/t001-nova/`. Keep the existing names when possible. If a name changes, update every matching JSON path.

Use descriptive `alt` text for every image. Do not put private client assets into the repository.

## Colors and typography

Review the design tokens in `design/`, `src/styles/themes.css` and `src/styles/global.css`. Keep token names stable so existing components continue to work.

## Validation

```bash
npm run check:data
npm run check:types
npm run check:seo
npm run check:links
npm run check:images
npm run build
```

Open the generated site on desktop and mobile before publishing.
