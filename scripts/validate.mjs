import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.resolve("content");
const TYPE_FOLDERS = ["races", "factions", "locations", "general", "champions", "bestiary"];
const WIKILINK = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
const norm = (s) => String(s).trim().toLowerCase();
const stripCode = (s) =>
  s.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");

const errors = [];
const warnings = [];

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue; // skips .obsidian, .trash, etc.
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.name.endsWith(".md")) out.push(full);
  }
  return out;
}

if (!fs.existsSync(CONTENT_DIR)) {
  console.error("validate: content/ folder not found");
  process.exit(1);
}

// Read all notes
const notes = [];
for (const file of walk(CONTENT_DIR)) {
  const rel = path.relative(CONTENT_DIR, file).split(path.sep);
  try {
    const { data, content } = matter(fs.readFileSync(file, "utf8"));
    notes.push({
      rel: rel.join("/"),
      folder: rel[0],
      depth: rel.length,
      name: path.basename(file, ".md"),
      published: data.published === true,
      aliases: Array.isArray(data.aliases) ? data.aliases.map(String) : [],
      body: stripCode(content),
    });
  } catch (err) {
    errors.push(`${rel.join("/")}: cannot read frontmatter (${err.message.split("\n")[0]})`);
  }
}

// 1. Published notes in the wrong place
for (const n of notes.filter((n) => n.published)) {
  if (n.depth === 1 || !TYPE_FOLDERS.includes(n.folder)) {
    warnings.push(`${n.rel}: published, but not inside Races/, Factions/ or Locations/ (it will NOT be built)`);
  } else if (n.depth > 2) {
    errors.push(`${n.rel}: published notes must sit directly in ${n.folder}/, not in a subfolder`);
  }
}

const wiki = notes.filter((n) => n.depth === 2 && TYPE_FOLDERS.includes(n.folder));

// 2. Duplicate note names (published or not, since Obsidian links would be ambiguous)
const byName = new Map();
for (const n of wiki) {
  const k = norm(n.name);
  byName.set(k, [...(byName.get(k) ?? []), n.rel]);
}
for (const [name, files] of byName) {
  if (files.length > 1) errors.push(`Duplicate note name "${name}": ${files.join(", ")}`);
}

// 3. Name/alias collisions between published notes
const owners = new Map();
for (const n of wiki.filter((n) => n.published)) {
  for (const key of [n.name, ...n.aliases].map(norm)) {
    if (!owners.has(key)) owners.set(key, new Set());
    owners.get(key).add(n.rel);
  }
}
for (const [key, files] of owners) {
  if (files.size > 1) errors.push(`"${key}" is used as a name or alias by: ${[...files].join(", ")}`);
}

// 4. Links to missing or unpublished notes, and empty alt text
const publishedKeys = new Set();
const draftKeys = new Set();
for (const n of wiki) {
  for (const key of [n.name, ...n.aliases].map(norm)) {
    (n.published ? publishedKeys : draftKeys).add(key);
  }
}
for (const n of wiki.filter((n) => n.published)) {
  const seen = new Set();
  for (const m of n.body.matchAll(WIKILINK)) {
    const key = norm(m[1]);
    if (publishedKeys.has(key) || seen.has(key)) continue;
    seen.add(key);
    const kind = draftKeys.has(key) ? "unpublished" : "missing";
    warnings.push(`${n.rel}: links to ${kind} note [[${m[1].trim()}]] (shown as plain text)`);
  }
  if (/!\[\s*\]\(/.test(n.body)) {
    warnings.push(`${n.rel}: body image with empty alt text`);
  }
}

// Report
for (const w of warnings) console.warn(`  warning: ${w}`);
for (const e of errors) console.error(`  ERROR: ${e}`);
console.log(
  `validate: ${wiki.filter((n) => n.published).length} published notes, ${errors.length} errors, ${warnings.length} warnings`
);
process.exit(errors.length > 0 ? 1 : 0);