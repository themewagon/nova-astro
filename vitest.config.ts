import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
import { resolveConfig, createSettings } from "./node_modules/astro/dist/core/config/index.js";
import { AstroLogger } from "./node_modules/astro/dist/core/logger/core.js";
import astro from "./node_modules/astro/dist/vite-plugin-astro/index.js";

// Contract tests render Astro components through experimental_AstroContainer,
// so Vitest needs Astro's internal compiler plugin.
const root = fileURLToPath(new URL("./", import.meta.url));
const { astroConfig } = await resolveConfig({ root }, "default");
const settings = await createSettings(astroConfig, "info", root);
const logger = new AstroLogger({
  level: "silent",
  destination: { write: () => undefined },
});

export default defineConfig({
  plugins: [astro({ settings, logger })],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
      "@layouts": fileURLToPath(new URL("./src/layouts", import.meta.url)),
      "@data": fileURLToPath(new URL("./src/data", import.meta.url)),
      "@styles": fileURLToPath(new URL("./src/styles", import.meta.url)),
      "@utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
      "@config": fileURLToPath(new URL("./src/config", import.meta.url)),
    },
  },
});
