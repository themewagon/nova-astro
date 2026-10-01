import type { DeveloperGroup } from "@/studio/types";
import type {
  StudioSectionConfig,
  StudioTemplateId,
} from "@/studio/engine/schema";

export interface StudioAdapter {
  id: StudioTemplateId;
  label: string;
  groups: DeveloperGroup[];
  sections: StudioSectionConfig[];
}
