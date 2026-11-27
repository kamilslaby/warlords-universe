import { getCollection } from "astro:content";
import { slug } from "github-slugger";
import { titleOf } from "./entry";

export const types = ["races", "factions", "locations", "general", "champions", "bestiary"] as const;

export const tagUrl = (tag: string) => `/tags/${slug(tag)}/`;

export async function getPublished() {
  const groups = await Promise.all(
    types.map(async (type) => {
      const entries = await getCollection(type, ({ data }) => data.published);
      return entries.map((entry) => ({
        type,
        entry,
        title: titleOf(entry),
        url: `/${type}/${entry.id}/`,
      }));
    })
  );
  return groups.flat().sort((a, b) => a.title.localeCompare(b.title));
}

export async function getTags() {
  const all = await getPublished();
  const tags = new Map<string, { label: string; slug: string; items: typeof all }>();
  for (const item of all) {
    for (const tag of item.entry.data.tags) {
      const s = slug(tag);
      if (!tags.has(s)) tags.set(s, { label: tag, slug: s, items: [] });
      tags.get(s)!.items.push(item);
    }
  }
  return [...tags.values()].sort((a, b) => a.label.localeCompare(b.label));
}