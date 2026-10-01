import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const temporaryRoots: string[] = [];

function makeTemporaryProject(name: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `${name} with spaces-`));
  temporaryRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("build safety scripts", () => {
  it("runs Astro from a project path containing spaces and restores staged pages", () => {
    const root = makeTemporaryProject("nova build test");
    const scriptDir = path.join(root, "src", "scripts");
    const astroDir = path.join(root, "node_modules", "astro", "bin");
    const pagesDir = path.join(root, "src", "pages");
    const marker = path.join(root, "astro-ran.txt");

    fs.mkdirSync(scriptDir, { recursive: true });
    fs.mkdirSync(astroDir, { recursive: true });
    fs.mkdirSync(pagesDir, { recursive: true });
    fs.mkdirSync(path.join(root, "node_modules", ".cache"), { recursive: true });
    fs.copyFileSync(path.join(projectRoot, "src/scripts/scope-pages.mjs"), path.join(scriptDir, "scope-pages.mjs"));
    fs.writeFileSync(path.join(root, "site.config.mjs"), "export const BUILD_SCOPE = { pages: ['/'], forceRemove: [] };\n");
    fs.writeFileSync(path.join(pagesDir, "index.astro"), "---\n---\n");
    fs.writeFileSync(path.join(pagesDir, "contact.astro"), "---\n---\n");
    fs.writeFileSync(path.join(astroDir, "astro.mjs"), "import fs from 'node:fs'; fs.writeFileSync(process.env.ASTRO_TEST_MARKER, 'ran');\n");

    execFileSync(process.execPath, [path.join(scriptDir, "scope-pages.mjs"), "build"], {
      cwd: root,
      env: { ...process.env, ASTRO_TEST_MARKER: marker },
    });

    expect(fs.readFileSync(marker, "utf8")).toBe("ran");
    expect(fs.existsSync(path.join(pagesDir, "contact.astro"))).toBe(true);
    expect(fs.readdirSync(path.join(pagesDir, "_disabled"))).toHaveLength(0);
    expect(fs.existsSync(path.join(root, "node_modules/.cache/scope-pages-manifest.json"))).toBe(false);
  });

  it("removes server-only PHP files from the generated static output", () => {
    const root = makeTemporaryProject("nova clean dist test");
    const dist = path.join(root, "dist");
    fs.mkdirSync(dist, { recursive: true });
    fs.writeFileSync(path.join(dist, "send-form.php"), "<?php echo 'private';");

    execFileSync(process.execPath, [path.join(projectRoot, "src/scripts/clean-dist.mjs")], { cwd: root });

    expect(fs.existsSync(path.join(dist, "send-form.php"))).toBe(false);
  });
});
