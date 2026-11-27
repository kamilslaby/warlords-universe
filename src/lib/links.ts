import { getCollection } from "astro:content";
import { titleOf } from "./entry";

export const types = ["races", "factions", "locations", "general", "champions", "bestiary"] as const;
const WIKILINK = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
const norm = (s: string) => s.trim().toLowerCase();
const stripCode = (s: string) =>
  s.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");

type Target = { id: string; filePath?: string; data: { aliases: string[] } };

export async function getBacklinks(target: Target) {
  const keys = new Set([titleOf(target), ...target.data.aliases].map(norm));
  const result: { title: string; url: string }[] = [];

  for (const type of types) {
    const entries = await getCollection(type, ({ data }) => data.published);
    for (const e of entries) {
      if (titleOf(e) === titleOf(target)) continue;
      const body = stripCode(e.body ?? "");
      const links = [...body.matchAll(WIKILINK)].map((m) => norm(m[1]));
      if (links.some((l) => keys.has(l))) {
        result.push({ title: titleOf(e), url: `/${type}/${e.id}/` });
      }
    }
  }
  return result.sort((a, b) => a.title.localeCompare(b.title));
}