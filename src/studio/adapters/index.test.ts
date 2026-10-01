import { describe, expect, it } from "vitest";
import { getStudioAdapter, listStudioAdapters } from "./index";

describe("studio adapters registry", () => {
  it("exposes only the Nova adapter", () => {
    const ids = listStudioAdapters().map((adapter) => adapter.id).sort();
    expect(ids).toEqual(["nova"]);
  });

  it("contains valid section option defaults", () => {
    const adapter = getStudioAdapter("nova");

    for (const section of adapter.sections) {
      expect(section.options.length).toBeGreaterThan(0);
      expect(section.options.includes(section.defaultVariant)).toBe(true);
    }
  });
});
