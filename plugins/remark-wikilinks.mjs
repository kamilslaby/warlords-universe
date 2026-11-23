import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { slug } from "github-slugger";
import { visit } from "unist-util-visit";

const CONTENT_DIR = path.resolve("content");
const TYPE_FOLDERS = { races: "races", factions: "factions", locations: "locations" };
const WIKILINK = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;
const norm = (s) => String(s).trim().toLowerCase();

// Index of published notes: name/alias -> { url }
let cache = null;
let cachedAt = 0;

function getIndex() {
  if (cache && Date.now() - cachedAt < 1000) return cache;
  const index = new Map();
  for (const [folder, type] of Object.entries(TYPE_FOLDERS)) {
    const dir = path.join(CONTENT_DIR, folder);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      if (data.published !== true) continue;
      const name = path.basename(file, ".md");
      const target = { url: `/${type}/${slug(name)}/` };
      const aliases = Array.isArray(data.aliases) ? data.aliases : [];
      for (const key of [name, ...aliases].map(norm)) {
        const existing = index.get(key);
        if (existing && existing.url !== target.url) {
          throw new Error(
            `Duplicate wiki name or alias "${key}": ${existing.url} and ${target.url}`
          );
        }
        index.set(key, target);
      }
    }
  }
  cache = index;
  cachedAt = Date.now();
  return index;
}

export default function remarkWikilinks() {
  return (tree) => {
    const index = getIndex();
    visit(tree, "text", (node, position, parent) => {
      if (!parent || position === undefined) return;
      const value = node.value;
      const out = [];
      let last = 0;
      for (const m of value.matchAll(WIKILINK)) {
        if (m.index > last) out.push({ type: "text", value: value.slice(last, m.index) });
        const [, rawTarget, heading, label] = m;
        const text = (label ?? rawTarget).trim();
        const hit = index.get(norm(rawTarget));
        if (hit) {
          const hash = heading ? `#${slug(heading.trim())}` : "";
          out.push({
            type: "link",
            url: hit.url + hash,
            children: [{ type: "text", value: text }],
          });
        } else {
          out.push({ type: "text", value: text }); // unpublished or missing: plain text
        }
        last = m.index + m[0].length;
      }
      if (out.length === 0) return;
      if (last < value.length) out.push({ type: "text", value: value.slice(last) });
      parent.children.splice(position, 1, ...out);
      return position + out.length;
    });
  };
}