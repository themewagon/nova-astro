import type { StudioAdapter } from "@/studio/adapters/types";
import novaProfileRaw from "@/studio/profiles/nova.json";
import {
  buildDefaultState,
  type ResolvedStudioState,
  type StudioProfile,
  type StudioSectionId,
  type StudioTemplateId,
  STUDIO_TEMPLATE_IDS,
  studioProfileSchema,
} from "./schema";

const PROFILE_MAP: Record<StudioTemplateId, unknown> = {
  nova: novaProfileRaw,
};

function isTemplateId(value: string | null): value is StudioTemplateId {
  return Boolean(value && STUDIO_TEMPLATE_IDS.includes(value as StudioTemplateId));
}

function parseProfile(template: StudioTemplateId): StudioProfile {
  const profile = PROFILE_MAP[template];
  const parsed = studioProfileSchema.safeParse(profile);

  if (!parsed.success) {
    throw new Error(
      `[studio] Invalid profile for template "${template}": ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

function applyProfileState(
  baseState: Record<StudioSectionId, string>,
  profile: StudioProfile,
  adapter: StudioAdapter,
): Record<StudioSectionId, string> {
  const next = { ...baseState };

  for (const section of adapter.sections) {
    const fromProfile = profile.sections[section.id]?.variant;
    if (fromProfile && section.options.includes(fromProfile)) {
      next[section.id] = fromProfile;
    }
  }

  return next;
}

function applyUrlOverrides(
  url: URL,
  currentState: Record<StudioSectionId, string>,
  adapter: StudioAdapter,
): Record<StudioSectionId, string> {
  const next = { ...currentState };

  for (const section of adapter.sections) {
    const raw = url.searchParams.get(section.id);
    if (raw && section.options.includes(raw)) {
      next[section.id] = raw;
    }
  }

  return next;
}

export function resolveTemplateFromUrl(url: URL): StudioTemplateId {
  const requested = url.searchParams.get("template");
  return isTemplateId(requested) ? requested : "nova";
}

export function resolveStudioState(
  url: URL,
  adapter: StudioAdapter,
): ResolvedStudioState {
  const profile = parseProfile(adapter.id);
  const defaults = buildDefaultState(adapter.sections);
  const withProfile = applyProfileState(defaults, profile, adapter);
  const mergedState = applyUrlOverrides(url, withProfile, adapter);

  const sectionIds = adapter.sections.map((section) => section.id);
  const rawStudio = url.searchParams.get("studio");
  const studioTab = sectionIds.includes(rawStudio as StudioSectionId)
    ? rawStudio
    : profile.studioTab && sectionIds.includes(profile.studioTab as StudioSectionId)
      ? profile.studioTab
      : sectionIds[0] || null;

  return {
    template: adapter.id,
    studioTab,
    state: mergedState,
  };
}

export function serializeStudioStateToSearchParams(
  template: StudioTemplateId,
  state: Partial<Record<StudioSectionId, string>>,
  studioTab?: string | null,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("template", template);

  (Object.keys(state) as StudioSectionId[]).forEach((sectionId) => {
    const value = state[sectionId];
    if (value) params.set(sectionId, value);
  });

  if (studioTab) {
    params.set("studio", studioTab);
  }

  return params;
}
