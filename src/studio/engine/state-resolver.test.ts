import { describe, expect, it } from "vitest";
import { getStudioAdapter } from "../adapters";
import {
  resolveStudioState,
  resolveTemplateFromUrl,
  serializeStudioStateToSearchParams,
} from "./state-resolver";

describe("resolveTemplateFromUrl", () => {
  it("uses Nova as fallback template", () => {
    const url = new URL("https://example.com/dev/components/");
    expect(resolveTemplateFromUrl(url)).toBe("nova");
  });

  it("accepts known template id", () => {
    const url = new URL("https://example.com/dev/components/?template=nova");
    expect(resolveTemplateFromUrl(url)).toBe("nova");
  });
});

describe("resolveStudioState", () => {
  it("merges profile defaults with valid URL overrides", () => {
    const adapter = getStudioAdapter("nova");
    const url = new URL(
      "https://example.com/dev/components/?template=nova&hero=registry-centered&pricing=minimal&studio=pricing",
    );

    const resolved = resolveStudioState(url, adapter);

    expect(resolved.template).toBe("nova");
    expect(resolved.state.hero).toBe("registry-centered");
    expect(resolved.state.pricing).toBe("minimal");
    expect(resolved.state.features).toBe("grid");
    expect(resolved.studioTab).toBe("pricing");
  });

  it("ignores invalid section variants", () => {
    const adapter = getStudioAdapter("nova");
    const url = new URL(
      "https://example.com/dev/components/?template=nova&features=unknown-layout",
    );

    const resolved = resolveStudioState(url, adapter);

    expect(resolved.state.features).toBe("grid");
  });
});

describe("serializeStudioStateToSearchParams", () => {
  it("serializes template, section state and active tab", () => {
    const state = {
      navbar: "centered",
      hero: "service",
      features: "cards-grid",
      pricing: "simple",
      cta: "centered",
      "section-pattern": "off",
      footer: "columns",
      theme: "nova",
    } as const;

    const params = serializeStudioStateToSearchParams("nova", state, "hero");

    expect(params.get("template")).toBe("nova");
    expect(params.get("hero")).toBe("service");
    expect(params.get("studio")).toBe("hero");
  });
});
