/**
 * Narzedzia do obslugi adresow URL w Astro zgodnie ze standardami projektu.
 */

/**
 * Formatuje link wewnetrzny tak, aby zawsze konczyl sie slashem (SEO)
 * i byl poprawnie sformatowany (brak podwojnych slashy).
 * Pomija linki zewnetrzne, mailto:, tel: oraz kotwice bez sciezki.
 */
export function formatInternalLink(href: string | null | undefined): string {
  if (!href) return '/';
  
  // Ignoruj linki zewnetrzne i specjalne
  if (
    href.startsWith('http') || 
    href.startsWith('mailto:') || 
    href.startsWith('tel:') ||
    href.startsWith('javascript:')
  ) {
    return href;
  }

  // Obsluga samej kotwicy
  if (href.startsWith('#')) {
    return href;
  }

  // Rozdzielenie sciezki od kotwicy i parametrow
  const [base, ...rest] = href.split(/([#?])/);
  const suffix = rest.join('');

  // Czyszczenie bazy (usuwanie wielu slashy na poczatku i koncu)
  let formattedBase = base.replace(/\/+/g, '/');
  
  if (!formattedBase.startsWith('/')) {
    formattedBase = '/' + formattedBase;
  }

  if (!formattedBase.endsWith('/')) {
    formattedBase = formattedBase + '/';
  }

  // Obsluga strony glownej (zeby nie bylo //)
  if (formattedBase === '//') formattedBase = '/';

  return formattedBase + suffix;
}

/**
 * Sprawdza czy dany link jest linkiem zewnetrznym
 */
export function isExternal(href: string): boolean {
  return href.startsWith('http') || href.startsWith('//');
}
