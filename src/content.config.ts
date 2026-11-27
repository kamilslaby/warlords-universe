import { defineCollection, z, type SchemaContext } from "astro:content";
import { glob } from "astro/loaders";

const entrySchema = ({ image }: SchemaContext) =>
  z
    .object({
      published: z.boolean().default(false),
      summary: z.string().optional(),
      aliases: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      image: image().optional(),
      imageAlt: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.published && !data.summary) {
        ctx.addIssue({ code: "custom", message: "Published notes need a summary" });
      }
      if (data.image && !data.imageAlt) {
        ctx.addIssue({ code: "custom", message: "imageAlt is required when image is set" });
      }
    });

const makeCollection = (folder: string) =>
  defineCollection({
    loader: glob({ pattern: "**/*.md", base: `./content/${folder}` }),
    schema: entrySchema,
  });

export const collections = {
  champions: makeCollection("champions"),
  factions: makeCollection("factions"),
  general: makeCollection("general"),
  locations: makeCollection("locations"),
  races: makeCollection("races"),
  bestiary: makeCollection("bestiary"),
};