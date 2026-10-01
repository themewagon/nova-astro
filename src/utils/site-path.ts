import { SITE_BASE } from '../../site.config.mjs';

const normalizedBase = `/${SITE_BASE.replace(/^\/+|\/+$/g, '')}`;

export function withSiteBase(value: string): string {
  if (!value) return value;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(value)) return value;

  const path = value.startsWith('/') ? value : `/${value}`;
  if (!normalizedBase || path === normalizedBase || path.startsWith(`${normalizedBase}/`)) {
    return path;
  }

  return `${normalizedBase}${path}`;
}
