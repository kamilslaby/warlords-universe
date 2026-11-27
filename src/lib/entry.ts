import fs from "node:fs";
import path from "node:path";
import { slug } from "github-slugger";

// Map of URL slug -> original file name, e.g. "black-blood" -> "Black Blood"
let cache: Map<string, string> | null = null;
let cachedAt = 0;

function fileNames(): Map<string, string> {
  if (cache && Date.now() - cachedAt < 1000) return cache;
  const map = new Map<string, string>();
  const root = path.resolve("content");
  if (fs.existsSync(root)) {
    for (const folder of fs.readdirSync(root, { withFileTypes: true })) {
      if (!folder.isDirectory() || folder.name.startsWith(".")) continue;
      for (const file of fs.readdirSync(path.join(root, folder.name))) {
        if (file.endsWith(".md")) {
          const name = file.slice(0, -3);
          map.set(slug(name), name);
        }
      }
    }
  }
  cache = map;
  cachedAt = Date.now();
  return map;
}

export const titleOf = (entry: { id: string }) =>
  fileNames().get(entry.id) ?? entry.id;

export const typeLabels: Record<string, { singular: string; plural: string }> = {
  races: { singular: "Race", plural: "Races" },
  factions: { singular: "Faction", plural: "Factions" },
  locations: { singular: "Location", plural: "Locations" },
  general: { singular: "General", plural: "General" },
  champions: { singular: "Champion", plural: "Champions" },
  bestiary: { singular: "Bestiary", plural: "Bestiary" },
};