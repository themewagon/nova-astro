export type SectionData = Record<string, unknown>;

export type SectionJsonModule = {
  default?: unknown;
  [key: string]: unknown;
};

function normalizeModulePath(path: string): string {
  return path.replace(/\\/g, '/');
}

export function getSectionDataKey(path: string): string {
  const normalizedPath = normalizeModulePath(path);
  return normalizedPath.split('/').pop()?.replace(/\.json$/, '') || '';
}

function isSectionData(value: unknown): value is SectionData {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Normalizuje moduly JSON do cache uzywanego przez PageBuilder i Studio.
 * Dzieki temu oba miejsca korzystaja z tej samej zasady mapowania nazwy pliku na dane.
 */
export function createSectionDataCache(
  modules: Record<string, SectionJsonModule>,
): Record<string, SectionData> {
  const cache: Record<string, SectionData> = {};

  Object.entries(modules).forEach(([path, module]) => {
    const key = getSectionDataKey(path);
    const data = Object.prototype.hasOwnProperty.call(module, 'default')
      ? module.default
      : module;

    if (!key || !isSectionData(data)) return;
    if (cache[key]) {
      throw new Error(`Duplicate section data key "${key}" in "${path}".`);
    }
    cache[key] = data;
  });

  return cache;
}
