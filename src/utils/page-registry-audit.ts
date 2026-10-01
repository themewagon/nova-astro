import fs from 'node:fs';
import path from 'node:path';

export interface PageRegistryVariant {
  component: unknown;
  dataKey?: unknown;
}

export interface PageRegistryEntry {
  id: string;
  defaultVariant: string;
  variants: Record<string, PageRegistryVariant>;
}

export interface PageConfigForAudit {
  heading?: unknown;
  sections?: unknown;
}

export interface PageRegistryAuditOptions {
  registry: Record<string, PageRegistryEntry>;
  sectionDataKeys: Set<string>;
  componentNames?: Set<string>;
}

export function getSectionDataKeys(projectRoot: string): Set<string> {
  const sectionsDir = path.join(projectRoot, 'src', 'data', 'sections');
  if (!fs.existsSync(sectionsDir)) return new Set();

  return new Set(
    fs.readdirSync(sectionsDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.slice(0, -'.json'.length)),
  );
}

export function auditPageConfig(
  pagePath: string,
  config: PageConfigForAudit,
  options: PageRegistryAuditOptions,
): string[] {
  const errors: string[] = [];
  const sections = Array.isArray(config.sections) ? config.sections : [];

  if (!Array.isArray(config.sections) || sections.length === 0) {
    errors.push(`${pagePath}: sections must be a non-empty array.`);
  }

  if (typeof config.heading !== 'string' || config.heading.trim() === '') {
    errors.push(`${pagePath}: heading is required to render exactly one page h1.`);
  }

  const shellCounts = new Map<string, number>();
  for (const section of sections) {
    if (!section || typeof section !== 'object') {
      errors.push(`${pagePath}: every section must be an object.`);
      continue;
    }

    const candidate = section as { id?: unknown; variant?: unknown };
    if (typeof candidate.id !== 'string' || candidate.id.trim() === '') {
      errors.push(`${pagePath}: section id must be a non-empty string.`);
      continue;
    }
    if (typeof candidate.variant !== 'string' || candidate.variant.trim() === '') {
      errors.push(`${pagePath}: section ${candidate.id} must define a variant.`);
      continue;
    }

    const entry = options.registry[candidate.id];
    if (!entry) {
      errors.push(`${pagePath}: unknown section id "${candidate.id}".`);
      continue;
    }

    if (candidate.id === 'navbar' || candidate.id === 'footer') {
      shellCounts.set(candidate.id, (shellCounts.get(candidate.id) ?? 0) + 1);
    }

    const variant = entry.variants[candidate.variant];
    if (!variant) {
      errors.push(`${pagePath}: section ${candidate.id} uses unknown variant "${candidate.variant}".`);
      continue;
    }

    if (candidate.variant === entry.defaultVariant && !entry.variants[entry.defaultVariant]) {
      errors.push(`${pagePath}: section ${candidate.id} points to a missing default variant.`);
    }

    if (variant.component !== null && typeof variant.component !== 'string') {
      errors.push(`${pagePath}: ${candidate.id}.${candidate.variant} component must be a string or null.`);
    }
    if (typeof variant.component === 'string' && options.componentNames && !options.componentNames.has(variant.component)) {
      errors.push(`${pagePath}: ${candidate.id}.${candidate.variant} maps to missing component "${variant.component}".`);
    }
    if (variant.dataKey !== undefined) {
      if (typeof variant.dataKey !== 'string' || !options.sectionDataKeys.has(variant.dataKey)) {
        errors.push(`${pagePath}: ${candidate.id}.${candidate.variant} references missing dataKey "${String(variant.dataKey)}".`);
      }
    }
  }

  for (const shell of ['navbar', 'footer']) {
    const count = shellCounts.get(shell) ?? 0;
    if (count !== 1) errors.push(`${pagePath}: expected exactly one ${shell}, found ${count}.`);
  }

  return errors;
}

export function auditRegistryDefaults(registry: Record<string, PageRegistryEntry>): string[] {
  const errors: string[] = [];
  for (const [id, entry] of Object.entries(registry)) {
    if (entry.id !== id) errors.push(`registry: key ${id} does not match entry id ${entry.id}.`);
    if (!entry.defaultVariant || !entry.variants[entry.defaultVariant]) {
      errors.push(`registry: ${id} has no valid defaultVariant.`);
    }
    if (Object.keys(entry.variants).length === 0) {
      errors.push(`registry: ${id} has no variants.`);
    }
  }
  return errors;
}
