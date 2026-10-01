import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SECTION_REGISTRY } from "@config/section-registry";
import { COMPONENT_MANIFEST, getComponentPath } from "@config/component-manifest";

// Why: check-registrations verifies consistency between section-registrations,
// public block manifest and .astro files. Thanks to this future
// moving blocks to subdirectories will not accidentally expose helpers.
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const REGISTRY_DIR = join(ROOT, "src", "components", "registry");

// Recursive scan of all .astro in the registry (supports subdirectories hero/, faq/ etc.)
function collectRegistryFiles(dir: string, prefix = "/src/components/registry"): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    const rel = `${prefix}/${e.name}`;
    if (e.isDirectory()) {
      files.push(...collectRegistryFiles(full, rel));
    } else if (e.name.endsWith(".astro")) {
      files.push(rel);
    }
  }
  return files;
}
const publicRegistryFiles = collectRegistryFiles(REGISTRY_DIR);

// Why: we read the public export registry instead of parsing a specific file.
// Thanks to this, the checker works in the same way after dividing entries into domain modules.
const referencedComponents = Object.values(SECTION_REGISTRY)
  .flatMap((entry) => Object.values(entry.variants).map((variant) => variant.component))
  .filter((component): component is string => typeof component === "string");

let errors = 0;

// Why: we additionally check references to components outside the registry
// (e.g. 'Navbar' from ui/molecules) - their files are not in the registry, but they must be
// be known to component-map so that PageBuilder will render them.
const KNOWN_NON_REGISTRY = ["Navbar"];

const manifestEntries = Object.entries(COMPONENT_MANIFEST);
const manifestNames = new Set(manifestEntries.map(([name]) => name));
// Po podziale na podkatalogi manifest bez explicit path jest resolvowany po nazwie pliku,
// so we compare by name, not by full path, to avoid false errors.
const manifestNamesByPath = new Map<string, string>();
for (const [name, entry] of manifestEntries) {
  if (entry.path) {
    manifestNamesByPath.set(getComponentPath(name, entry), name);
  }
}

// 1. Each public registry file must be described in the manifest and used.
for (const path of publicRegistryFiles) {
  const name = path.split("/").pop()?.replace(/\.astro$/, "") ?? "";
  const hasManifest = manifestNames.has(name) || manifestNamesByPath.has(path);
  if (!hasManifest) {
    console.error(`  BRAK wpisu manifestu dla publicznego pliku: ${path}`);
    errors++;
  }
  if (!referencedComponents.includes(name)) {
    console.error(`  OSIEROCONY plik (brak odwołania w section-registry): ${name}.astro`);
    errors++;
  }
}

// 2. Each manifest entry must point to an existing file.
// For entries without an explicit path, we search by file name in the entire registry tree.
for (const [name, entry] of manifestEntries) {
  if (entry.path) {
    const path = getComponentPath(name, entry);
    const absolutePath = join(ROOT, path.replace(/^\//, "").replaceAll("/", "\\"));
    if (!existsSync(absolutePath)) {
      console.error(`  BRAK pliku wskazanego przez manifest: ${name} -> ${path}`);
      errors++;
    }
  } else {
    const found = publicRegistryFiles.some((p) => p.endsWith(`/${name}.astro`));
    if (!found) {
      console.error(`  BRAK pliku dla wpisu manifestu: ${name} (szukano */${name}.astro)`);
      errors++;
    }
  }
}

// 3. Each component in the registry must have a file in its manifest
for (const name of [...new Set(referencedComponents)]) {
  if (manifestNames.has(name)) continue;
  if (KNOWN_NON_REGISTRY.includes(name)) continue;
  console.error(`  BRAK wpisu manifestu dla komponentu: ${name}`);
  errors++;
}

if (errors > 0) {
  console.error(`\nBłędów: ${errors}. Sprawdź src/config/section-registry.ts i pliki w src/components/registry/`);
  process.exit(1);
} else {
  console.log("Wszystkie komponenty registry są poprawnie zarejestrowane.");
}
