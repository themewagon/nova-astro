# AI Quickstart

Nova is an Astro 7 template with a data-driven homepage, reusable section variants and a documented design system. This guide is the shortest path for an AI coding assistant or a developer using AI tools.

## Start here

```bash
npm ci
npm run dev
```

Before editing, inspect the relevant source of truth. Keep changes small and prefer existing components, data contracts and utilities.

## Source of truth map

| Task | Edit here | Do not start here |
| --- | --- | --- |
| Homepage copy | `src/data/i18n/nova.json` | Astro component markup |
| Section content | `src/data/sections/*.json` | Hardcoded strings in components |
| Homepage order | `src/data/pages/index.json` | Route markup |
| Section variants | `src/config/section-registry/` | A new component without checking the registry |
| Component paths | `src/config/component-manifest.ts` | Manual dynamic imports |
| Design tokens | `design/nova.md` | Generated CSS files |
| Generated theme CSS | `npm run design:sync` | Direct edits to `src/styles/themes.css` |
| Site URL, locales and build scope | `site.config.mjs` | Scattered environment checks |

## Safe AI workflow

1. Read `CUSTOMIZATION.md`, `CONTENT-GUIDE.md` and `DESIGN_RULES.md` when the task changes content or visuals.
2. Search for an existing component, variant or utility before creating a new one.
3. Change JSON data when the request is content or section ordering.
4. Reuse aliases such as `@components/`, `@data/`, `@styles/` and `@utils/`.
5. Keep internal URLs in trailing-slash form.
6. Preserve the English and Polish language objects when changing homepage copy.
7. Run `npm run ai:check` after the change.
8. Run `npm run build` before packaging or publishing.
9. Check the result in a browser on mobile and desktop for visual changes.

## Avoid these changes

- Do not edit generated theme CSS instead of changing `design/nova.md`.
- Do not add a new section before checking `src/config/section-registry/` and the component manifest.
- Do not move content into Astro markup when the existing JSON data model can express it.
- Do not add a new font from a CDN.
- Do not use hardcoded colors when a design token exists.
- Do not add custom hover motion to cards. Use the existing `ui-card-interactive` contract.
- Do not remove the build scope or development-only routes to fix a local preview issue.
- Do not commit `.env`, generated build output, `node_modules` or private client assets.

## Useful prompts

```text
Change the homepage headline while preserving the existing section structure. Update both language objects, keep the current CTA links, then run npm run ai:check.
```

```text
Replace the Nova color palette using design/nova.md and the existing token workflow. Do not edit generated CSS directly. Run npm run design:sync and npm run ai:check.
```

```text
Add a new homepage service block using an existing section variant if possible. Inspect the section registry, data contracts and component manifest first. Keep internal links trailing-slash compatible and run npm run ai:check.
```

## Validation commands

```bash
npm run ai:check
npm run build
npm run package:marketplace
```

`public/llms.txt` describes the deployed website for machine-readable discovery. This file describes the source repository and the workflow for coding assistants.
