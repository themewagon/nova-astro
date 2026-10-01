import type { StudioTemplateId } from "@/studio/engine/schema";
import { novaStudioAdapter } from "./nova.adapter";
import type { StudioAdapter } from "./types";

const ADAPTERS: Record<StudioTemplateId, StudioAdapter> = {
  nova: novaStudioAdapter,
};

export function getStudioAdapter(template: StudioTemplateId): StudioAdapter {
  return ADAPTERS[template];
}

export function listStudioAdapters(): StudioAdapter[] {
  return Object.values(ADAPTERS);
}
