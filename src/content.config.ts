// Dlaczego: definicja kolekcji Content Collections w Astro v7
// Astro v7 uzywa nowego API z `loader` zamiast `type: "content"`
// `glob()` loader automatycznie wykrywa pliki markdown w podanym katalogu
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blogCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
