import type { CompanyConfig } from '@/types/config';

/**
 * Helper do social mediow.
 * Dlaczego: company.json trzyma social media jako prosty obiekt
 * { facebook: "https://...", instagram: "", ... } - samo linki, bez
 * przelacznikow. Komponent pokazuje tylko profile z podanym linkiem
 * (niepustym i roznym od "#"), reszta sie nie renderuje.
 */

export type SocialEntry = {
  key: string;
  label: string;
  icon: string;
  href: string;
};

export const SOCIAL_META: Record<string, { label: string; icon: string }> = {
  facebook: { label: 'Facebook', icon: 'ph-facebook-logo' },
  instagram: { label: 'Instagram', icon: 'ph-instagram-logo' },
  youtube: { label: 'YouTube', icon: 'ph-youtube-logo' },
  twitter: { label: 'X (Twitter)', icon: 'ph-x-logo' },
};

/** Zwraca social media z podanym linkiem (pomija puste i "#"). */
export function getEnabledSocialLinks(company: CompanyConfig | Record<string, unknown>): SocialEntry[] {
  const socials = (company as any)?.socials;
  if (!socials || typeof socials !== 'object') return [];

  return Object.entries(socials as Record<string, string>)
    .filter(([key, href]) => href && href.trim() !== '' && href.trim() !== '#')
    .map(([key, href]) => {
      const meta = SOCIAL_META[key] ?? { label: key, icon: 'ph-globe' };
      return { key, label: meta.label, icon: meta.icon, href: href.trim() };
    });
}

/** Wersja dla Schema.org: lista linkow do sameAs. */
export function getSocialUrls(company: CompanyConfig | Record<string, unknown>): string[] {
  return getEnabledSocialLinks(company).map((s) => s.href);
}
