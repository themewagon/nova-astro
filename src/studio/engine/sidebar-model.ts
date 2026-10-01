import type { DeveloperSection } from "@/studio/types";
import type { StudioAdapter } from "@/studio/adapters/types";
import type { StudioSectionId } from "./schema";

export function buildStudioSidebarSections(
  adapter: StudioAdapter,
  state: Record<StudioSectionId, string>,
): DeveloperSection[] {
  return adapter.sections.map((section) => ({
    id: section.id,
    label: section.label,
    groupId: section.groupId,
    icon: section.icon,
    current: state[section.id],
    options: section.options,
    hint: section.hint,
  }));
}
