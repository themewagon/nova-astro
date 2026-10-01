// Why: component-map is a registry pattern mapping section names from JSON to
// actual Astro components. This lets PageBuilder dynamically resolve
// components without hardcoding imports in render logic.
//
import { COMPONENT_MANIFEST, getComponentPath } from './component-manifest';

// Glob is recursive so future directory splits do not require
// loader changes. Manifest still restricts the public mapped set to
// blocks intended for PageBuilder, not helper components.
import Navbar from "@components/ui/molecules/Navbar.astro";

const registryModules = import.meta.glob("/src/components/registry/**/*.astro", { eager: true });

// Dlaczego: kluczem jest nazwa pliku bez rozszerzenia (np. "HeroBlock"),
// because section-registry refers to components by filename.
// Supports both flat and subdirectories: searches for file name by suffix.
const registryMap: Record<string, any> = Object.fromEntries(
  Object.entries(COMPONENT_MANIFEST).map(([name, entry]) => {
    const explicitPath = entry.path ? getComponentPath(name, entry) : null;
    let module: { default?: unknown } | undefined;
    let resolvedPath = explicitPath;
    if (explicitPath) {
      module = registryModules[explicitPath] as { default?: unknown } | undefined;
    } else {
      // Search the entire globe by file name (recursively)
      const found = Object.entries(registryModules).find(([p]) => p.endsWith(`/${name}.astro`));
      if (found) {
        resolvedPath = found[0];
        module = found[1] as { default?: unknown };
      }
    }
    if (!module) {
      throw new Error(`Component manifest entry "${name}" points to missing file "${resolvedPath ?? name}.astro".`);
    }
    return [name, (module as { default?: unknown }).default ?? module];
  }),
);

// Why: Navbar is an exception, it lives in ui/molecules (not registry/),
// because it is a shell element, not a section. We register it manually, glob covers the rest.
const COMPONENT_MAP: Record<string, any> = {
  Navbar,
  ...registryMap,
};

export { COMPONENT_MAP };
