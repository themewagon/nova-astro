/** Krotka data publikacji wpisu (np. lista bloga). */
export function formatBlogDate(iso: string | Date, locale = "pl-PL"): string {
	const d = iso instanceof Date ? iso : new Date(iso);
	if (Number.isNaN(d.getTime())) return String(iso);
	return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}
