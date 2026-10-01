/**
 * Narzędzia do normalizacji i czyszczenia danych przychodzących z plików JSON.
 * Zapewniaja bezpieczne wartosci domyslne dla komponentow Astro.
 *
 * Why: obronnosc danych - JSON od klienta moze miec brakujace pola, null,
 * puste stringi lub niepoprawne typy. Te helpery zamieniaja je na bezpieczne
 * wartosci domyslne, zeby komponenty sie nie wysypaly.
 */

export type CtaVariant = 'primary' | 'outline' | 'ghost';

export interface RawCta {
  label?: string | null;
  href?: string | null;
  prefix?: string | null;
  variant?: string | null;
}

export interface NormalizedCta {
  label: string;
  href: string;
  prefix: string;
  variant: CtaVariant;
}

/**
 * Normalizuje dane przycisku CTA
 */
export function normalizeCta(raw: RawCta | null | undefined, defaultLabel = 'Dowiedz się więcej'): NormalizedCta {
  // Why: obslugujemy null/undefined, bo klient moze nie podac CTA wcale.
  if (!raw) {
    return {
      label: defaultLabel,
      href: '#',
      prefix: '',
      variant: 'primary'
    };
  }

  // Why: validacja variantu z whitelista. Klient moze wpisac dowolny string,
  // wiec sprawdzamy czy nalezy do dozwolonych wartosci. Jesli nie, fallback na primary.
  const validVariants: CtaVariant[] = ['primary', 'outline', 'ghost'];
  const variant = validVariants.includes(raw.variant as CtaVariant) 
    ? (raw.variant as CtaVariant) 
    : 'primary';

  return {
    label: raw.label || defaultLabel,
    href: raw.href || '#',
    prefix: raw.prefix || '',
    variant
  };
}

/**
 * Normalizuje dane tekstowe (usuwa nadmiarowe spacje, zapewnia string)
 */
export function normalizeText(text: any, fallback = ''): string {
  // Why: sprawdzamy typeof przed trim, bo JSON moze miec liczbe, obiekt lub null
  // zamiast stringa.bez tego sprawdzenia komponent sie wysypie.
  if (typeof text !== 'string') return fallback;
  return text.trim() || fallback;
}

/**
 * Zapewnia, ze tablica danych istnieje i nie ma w niej pustych elementow
 */
export function normalizeArray<T>(arr: any, filterFn?: (item: T) => boolean): T[] {
  // Why: obslugujemy nie-tablice (null, undefined, obiekt) zwracajac pusta tablice.
  // filter opcjonalnie usuwa elementy, ktore nie spelniaja warunku (np. puste obiekty).
  if (!Array.isArray(arr)) return [];
  const clean = arr.filter(item => item !== null && item !== undefined);
  return filterFn ? clean.filter(filterFn) : clean;
}
