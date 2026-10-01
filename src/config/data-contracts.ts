import { z } from 'zod';

export const PageSectionSchema = z.object({
  id: z.string().min(1),
  variant: z.string().min(1),
}).passthrough();

export const PageSeoSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  ogImage: z.string().optional(),
  noIndex: z.boolean().optional(),
}).passthrough();

export const PageLayoutSchema = z.object({
  theme: z.string().optional(),
  sectionPattern: z.enum(['off', 'repeat', 'mesh', 'noise']).optional(),
}).passthrough();

/**
 * The contract describes the structure of the site configuration, but leaves room for
 * additional fields used by special pages, for example 404.
 */
export const PageConfigSchema = z.object({
  enabled: z.boolean().optional(),
  devOnly: z.boolean().optional(),
  seo: PageSeoSchema.optional(),
  heading: z.string().optional(),
  layout: PageLayoutSchema.optional(),
  sections: z.array(PageSectionSchema).optional(),
}).passthrough();

/**
 * Section data is an intentionally open object. Specific fields belong to a block,
 * while the common contract ensures that each file is a JSON object.
 */
export const SectionDataSchema = z.record(z.string(), z.unknown());

export type PageConfigData = z.infer<typeof PageConfigSchema>;
export type PageSectionData = z.infer<typeof PageSectionSchema>;
export type SectionData = z.infer<typeof SectionDataSchema>;
