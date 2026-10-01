import { z } from "zod";

export const STUDIO_TEMPLATE_IDS = ["nova"] as const;
export type StudioTemplateId = (typeof STUDIO_TEMPLATE_IDS)[number];

export const STUDIO_SECTION_IDS = [
  "navbar",
  "hero",
  "features",
  "services",
  "steps",
  "contact-form",
  "contact",
  "stats",
  "brands",
  "about",
  "portfolio",
  "case-studies",
  "blog",
  "testimonials",
  "team",
  "faq",
  "scope",
  "benefits",
  "location",
  "before-after",
  "pricing",
  "cta",
  "newsletter",
  "timeline",
  "sidebar",
  "section-pattern",
  "footer",
  "theme",
] as const;
export type StudioSectionId = (typeof STUDIO_SECTION_IDS)[number];

const sectionVariantSchema = z.object({
  variant: z.string().min(1),
});

export const studioProfileSchema = z.object({
  template: z.enum(STUDIO_TEMPLATE_IDS),
  updatedAt: z.string().optional(),
  studioTab: z.string().optional(),
  sections: z.record(z.string(), sectionVariantSchema),
});

export type StudioProfile = z.infer<typeof studioProfileSchema>;

export interface StudioSectionConfig {
  id: StudioSectionId;
  label: string;
  groupId: string;
  icon: string;
  hint?: string;
  options: string[];
  defaultVariant: string;
}

export type StudioStateMap = Record<StudioSectionId, string>;

export interface ResolvedStudioState {
  template: StudioTemplateId;
  studioTab: string | null;
  state: StudioStateMap;
}

export function buildDefaultState(
  sections: StudioSectionConfig[],
): StudioStateMap {
  return sections.reduce<StudioStateMap>(
    (acc, section) => {
      acc[section.id] = section.defaultVariant;
      return acc;
    },
    {
      navbar: "centered",
      hero: "service",
      features: "grid",
      services: "off",
      steps: "off",
      "contact-form": "off",
      contact: "off",
      stats: "off",
      brands: "off",
      about: "off",
      portfolio: "off",
      "case-studies": "off",
      blog: "off",
      testimonials: "off",
      team: "off",
      faq: "off",
      scope: "off",
      benefits: "off",
      location: "off",
      "before-after": "off",
      pricing: "estimate",
      cta: "centered",
      newsletter: "off",
      timeline: "off",
      sidebar: "off",
      "section-pattern": "off",
      footer: "columns",
      theme: "nova",
    },
  );
}
