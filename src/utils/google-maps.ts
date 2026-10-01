/**
 * Link do Google Maps z indeksowalnym URL (homepage → podstrona z kotwica + ten link w tresci).
 */
export function googleMapsSearchUrl(query: string): string {
	const q = query.trim();
	if (!q) return "https://www.google.com/maps/";
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Demo: jedna linijka adresu pod stale zapytanie mapy. */
export const REGISTRY_DEMO_OFFICE_ADDRESS = "Al. Jerozolimskie 123, 00-001 Warszawa";

/**
 * Tymczasowy iframe z Google Maps (Palac Kultury — Warszawa).
 * W produkcji: Maps → Udostępnij → Zembeduj mapę → wklej `src` tutaj lub w danych strony.
 */
export const REGISTRY_DEMO_GOOGLE_MAP_EMBED =
	"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d97716.27777367992!2d20.9185968!3d52.2297716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471eccf6699361fe%3A0xb975570335e7cb94!2sPa%C5%82ac%20Kultury%20i%20Nauki!5e0!3m2!1spl!2spl!4v1735689600000!5m2!1spl!2spl";
