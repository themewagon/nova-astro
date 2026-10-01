export {
  buildDefaultState,
  studioProfileSchema,
  STUDIO_SECTION_IDS,
  STUDIO_TEMPLATE_IDS,
  type ResolvedStudioState,
  type StudioProfile,
  type StudioSectionConfig,
  type StudioSectionId,
  type StudioStateMap,
  type StudioTemplateId,
} from "./schema";
export {
  resolveStudioState,
  resolveTemplateFromUrl,
  serializeStudioStateToSearchParams,
} from "./state-resolver";
export { buildStudioSidebarSections } from "./sidebar-model";
