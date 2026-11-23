# Lore Wiki

A public, text-first wiki for the lore of an original IP. Written in Obsidian, built with Astro, styled with Tailwind, searched with Pagefind. Static site, single author, English only.

This file is the manual: how the project works, how to do the common jobs, and what to check when something breaks. For the original goals and scope, see `REQUIREMENTS.md`.

## Contents

1. [How it works](#1-how-it-works)
2. [Project structure](#2-project-structure)
3. [Daily commands](#3-daily-commands)
4. [Writing notes](#4-writing-notes)
5. [Content operations](#5-content-operations)
6. [Site operations](#6-site-operations)
7. [Maintenance](#7-maintenance)
8. [Troubleshooting](#8-troubleshooting)
9. [Rules to remember](#9-rules-to-remember)
10. [Not built yet](#10-not-built-yet)

---

## 1. How it works

- Notes are Markdown files in `content/`, one folder per category: `races/`, `factions/`, `locations/`.
- A note is only part of the site if its frontmatter says `published: true`. Everything else is ignored.
- Astro reads the notes as content collections and builds one static page per published note, plus home, category, and tag pages.
- `[[wikilinks]]` are turned into real links by a small plugin (`plugins/remark-wikilinks.mjs`). Links to unpublished or missing notes show as plain text.
- Backlinks ("Pages that link here") are computed at build time from the same links.
- Pagefind indexes the built article pages and provides search at `/search/`.
- `npm run build` validates the content first, then builds, then indexes for search.

Stack: Astro 7, Tailwind CSS (with the typography plugin), Pagefind. Markdown is processed with the `unified()` (remark) processor instead of Astro 7's default, so the wikilink plugin can be a remark plugin.

## 2. Project structure

```
content/                    Notes (copy of the Obsidian vault)
  races/  factions/  locations/
plugins/
  remark-wikilinks.mjs      Turns [[links]] into real links
scripts/
  validate.mjs              Checks notes before every build
src/
  assets/                   Images (races/, factions/, locations/ folders suggested)
  components/EntryList.astro  List of entries (used on index and tag pages)
  content.config.ts         Collections and frontmatter schema
  layouts/Base.astro        Page shell: <head>, navbar, keyboard shortcut for search
  lib/
    content.ts              Gets published entries and tags
    entry.ts                Title from file name, category labels
    links.ts                Backlinks
  pages/
    index.astro             Home page
    search.astro            Search page
    [type]/index.astro      Category index (/races/)
    [type]/[slug].astro     Article page (/races/elves/)
    tags/index.astro        All tags
    tags/[tag].astro        One tag
  styles/global.css         Tailwind import and typography plugin
astro.config.mjs            Markdown processor and wikilink plugin
```

## 3. Daily commands

| Command | What it does |
|---|---|
| `npm run dev` | Local site with live reload at `http://localhost:4321`. Search does not work here. |
| `npm run validate` | Checks the notes (see section 8). Fast, run it any time. |
| `npm run build` | Validates, builds into `dist/`, then builds the search index. Stops if validation has errors. |
| `npm run preview` | Serves the built site. **Use this to test search**, after `npm run build`. |

## 4. Writing notes

### Frontmatter

Every note needs frontmatter at the very top. Only the first field matters for publishing; `summary` is required once published.

```yaml
---
published: true
summary: One line used in search results and link previews.
aliases: [The Legion, Ironbound]
tags: [military, northern-realms]
image: ../../src/assets/factions/iron-legion.jpg
imageAlt: Banner of the Iron Legion
---
```

| Field | Required | Notes |
|---|---|---|
| `published` | to appear on the site | Missing means `false` |
| `summary` | yes, if published | Shown in lists, search, and meta description |
| `aliases` | no | Other names. Searchable, and `[[Alias]]` links work |
| `tags` | no | Tags that differ only in capitals or spaces (`Northern Realms`, `northern-realms`) become one tag page |
| `image` | no | Path relative to the note, pointing into `src/assets/` |
| `imageAlt` | yes, if `image` is set | Alt text |

- The **title** is the file name (`Iron Legion.md` is titled "Iron Legion").
- The **category** is the folder the note sits in.
- If a value contains a colon, put it in quotes: `summary: "Ruled by two kings: one living, one not."`
- Lists are `[a, b]` or one `- item` per line. Not `tags: a, b`.
- YAML does not allow tab characters for indentation.

### Links

```md
[[Elves]]                  link to a note (by file name or alias)
[[Elves|the elven people]] link with custom text
[[Elves#History]]          link to a heading in that note
```

### Quotes and code blocks

```md
> The mountains remember what the kings forget.
>
> *— Elder Varn, Keeper of the Pass*
```

Fenced code blocks (```` ``` ````) work as normal Markdown.

### Images in the body

Images are not stored in the vault. They live in `src/assets/`, and notes point to them with a path relative to the note:

```md
![Alt text](../../src/assets/races/elves.jpg)
```

From `content/races/Elves.md`, `../../` leads to the repo root. Astro resizes and converts these images at build time. A wrong path stops the build. Always write alt text.

### Not supported on the site

Obsidian embeds (`![[Note]]`), callouts (`> [!note]`), and Dataview. They will appear as raw text.

---

## 5. Content operations

### Add a note

1. Create `content/<category>/Note Name.md`.
2. Add frontmatter with `published: true` and a `summary`.
3. Write the text. Run `npm run validate`.

### Publish, unpublish, or delete a note

- **Publish:** set `published: true`.
- **Unpublish:** set `published: false`. The page disappears, and links to it become plain text.
- **Delete:** delete the file. Run `npm run validate`, which warns about notes that still link to it.

### Rename a note

The URL comes from the file name, so renaming changes the URL, and old links to that page (from outside the wiki) stop working. Inside Obsidian, renaming updates `[[links]]` in other notes automatically. To keep old `[[Old Name]]` links working, add the old name to `aliases`.

### Move a note to another category

Move the file to the other folder. The URL changes (`/races/x/` becomes `/factions/x/`).

### Add or change an image

1. Put the file in `src/assets/<category>/`. Use a lowercase name without spaces.
2. Set `image` and `imageAlt` in the frontmatter (or use the Markdown image syntax in the body).

### Add aliases and tags

Add them to the frontmatter lists. To rename a tag everywhere, change it in each note that uses it (search the folder for the old tag).

### Update the site from the vault

The repo holds a **copy** of the vault in `content/`. To refresh it:

1. Commit your current state first, so you can undo.
2. Mirror the vault into `content/`, skipping Obsidian's settings. In PowerShell:

   ```powershell
   robocopy "C:\path\to\your\vault" "content" /MIR /XD .obsidian .trash
   ```

   Check the source path carefully: `/MIR` makes `content/` identical to the source, which **deletes** anything in `content/` that is not in the vault. (Robocopy reports success with exit codes 0 to 7.)
3. Run `npm run validate`, then `npm run dev` to look at the result.
4. Commit and push.

Notes outside `races/`, `factions/`, and `locations/` are ignored by the site (the validator warns if one of them is marked published).

---

## 6. Site operations

### Add a new category (folder)

Categories are currently listed in several files. Doing all of them keeps everything consistent. Example: adding **Items** (`content/items/`):

1. Create the folder `content/items/` and add a note.
2. `src/content.config.ts`: add `items: makeCollection("items")` to `collections`.
3. `plugins/remark-wikilinks.mjs`: add `items: "items"` to `TYPE_FOLDERS`.
4. `scripts/validate.mjs`: add `"items"` to `TYPE_FOLDERS`.
5. `src/lib/content.ts`: add `"items"` to the `types` list.
6. `src/lib/links.ts`: add `"items"` to its `types` list.
7. `src/lib/entry.ts`: add `items: { singular: "Item", plural: "Items" }` to `typeLabels`.
8. `src/pages/[type]/[slug].astro`: add `"items"` to the `types` list inside `getStaticPaths`.
9. `src/layouts/Base.astro`: add `{ href: "/items/", label: "Items" }` to `links` (this is what puts it in the navbar).

Restart `npm run dev`, then run `npm run validate`. If you skip a step:

| Missing step | Symptom |
|---|---|
| 2 | Build error: the collection does not exist |
| 3 | `[[links]]` to notes in the new category show as plain text |
| 4 | Validator warns the notes are not in a category folder |
| 5 | Category missing from the home page, category index, and tag pages |
| 6 | Backlinks from the new category's notes never show |
| 7 | Error on the article page (no label for the category) |
| 8 | Articles in the category return 404 |
| 9 | Works, but the category is not in the navbar |

Folder names must be lowercase and match exactly everywhere (a Linux build server is case-sensitive).

### Rename or remove a category

Do the same steps in reverse (or with the new name). Renaming a folder changes every URL in it.

### Organize the navbar

Edit the `links` list in `src/layouts/Base.astro`. The order of the list is the order in the navbar. Each entry is a label and an address:

```ts
const links = [
  { href: "/races/", label: "Races" },
  { href: "/factions/", label: "Factions" },
  { href: "/locations/", label: "Locations" },
  { href: "/tags/", label: "Tags" },
  { href: "/search/", label: "Search" },
];
```

The link for the page you are on is shown in bold automatically. Navbar links can also point to a standalone page or an external site.

### Add a standalone page (About, Credits, ...)

Create `src/pages/about.astro`:

```astro
---
import Base from "../layouts/Base.astro";
---

<Base title="About">
  <main class="mx-auto max-w-3xl px-4 py-8">
    <h1 class="text-3xl font-bold">About</h1>
    <p class="prose mt-4">Text here.</p>
  </main>
</Base>
```

It is available at `/about/`. Add `{ href: "/about/", label: "About" }` to the navbar list to link it. Pages like this are not part of search (only article pages are indexed).

### Change the home page

Edit `src/pages/index.astro`. The title and intro text are plain HTML. The category cards (with entry counts) are generated from the category list, so new categories appear there automatically (after step 5 above).

### Add or change the footer

There is **no footer yet**. To add one, put this in `src/layouts/Base.astro`, right after `<slot />`:

```astro
<footer class="mt-16 border-t border-stone-200 bg-white">
  <div class="mx-auto max-w-5xl px-4 py-6 text-sm text-stone-500">
    © {new Date().getFullYear()} Your Name. Warlords Universe.
  </div>
</footer>
```

Since the layout is shared, the footer appears on every page. Editing it later means editing the same block.

### Change the site name, favicon, or logo

- **Name:** it appears in `src/layouts/Base.astro` (navbar), `src/pages/index.astro` (title and heading), and any page `title` you set.
- **Favicon:** put the file in `public/` and add `<link rel="icon" href="/favicon.svg" />` inside `<head>` in `Base.astro` (adjust the file name).
- **Logo:** replace the text link in the navbar with an `<img>` or Astro `<Image />`.

### Change colors, fonts, and layout

All styling is Tailwind classes in the `.astro` files (for example `bg-stone-50`, `text-stone-900`, `max-w-5xl`). Change the class names to change the look. Article text is styled by the `prose prose-stone` classes in `src/pages/[type]/[slug].astro`. The site is light mode only.

### Add a new frontmatter field (for example `leader` on factions)

1. `src/content.config.ts`: add it to `entrySchema`, for example `leader: z.string().optional(),`.
2. `src/pages/[type]/[slug].astro`: show it inside the infobox `<dl>`:

   ```astro
   {entry.data.leader && (
     <div>
       <dt class="font-semibold">Leader</dt>
       <dd>{entry.data.leader}</dd>
     </div>
   )}
   ```

3. Use it in a note's frontmatter. The field is optional, so existing notes keep working.

Fields added this way apply to all categories. Show them only for the right category by checking `type` in the template.

### Change what search indexes or filters

- Only pages containing `data-pagefind-body` are indexed. It is on `<main>` in `src/pages/[type]/[slug].astro`.
- Parts of a page excluded from search have `data-pagefind-ignore` (breadcrumbs, contents, backlinks).
- The "Type" filter comes from `data-pagefind-filter="type"` on the infobox label.
- The search shortcut (`/` and Ctrl+K) is the script at the bottom of `src/layouts/Base.astro`.

---

## 7. Maintenance

### Publish an update

Commit and push to GitHub. (Deployment is not set up yet, see section 10.) Before pushing, run `npm run build` once and fix anything it reports.

### Upgrade Astro and dependencies

```bash
npx @astrojs/upgrade
```

Then read the upgrade guide for the new major version, run `npm run build`, and test search with `npm run preview`. The wikilink plugin depends on the `unified()` Markdown processor in `astro.config.mjs`. If a future Astro version changes that, this is the first place to check.

### Backups

The repo on GitHub is the backup of the site and the notes. Your Obsidian vault is the original, so keep backing it up as you do now.

---

## 8. Troubleshooting

### What `npm run validate` checks

Errors (stop the build):
- Two notes with the same name, or the same name or alias used by two published notes
- A published note inside a subfolder of a category
- A note whose frontmatter cannot be read

Warnings (the build continues):
- A published note outside the category folders (it will not be built)
- A `[[link]]` to a missing or unpublished note
- A body image with empty alt text

Astro itself rejects: a published note without `summary`, an `image` without `imageAlt`, a bad image path, and wrong value types (such as `published: "yes"`).

### Problems and fixes

| Problem | Likely cause and fix |
|---|---|
| Note does not appear | `published` is not `true`; wrong folder or capitalization; note is in a subfolder; YAML error at the top of the file. Run `npm run validate`. |
| Build fails on a note | Missing `summary`, `image` without `imageAlt`, wrong value type, or a bad image path. The error names the file. |
| `[[Link]]` shows as plain text | Target is unpublished, misspelled, or missing. Check the validate warnings. Alias spelling must match. |
| Link or backlink looks outdated | Astro caches rendered notes. Restart `npm run dev`; if still wrong, delete the `.astro` folder and start again. |
| Image broken or build error about an image | Wrong number of `../` (from `content/<category>/` it is `../../src/assets/...`), wrong file name or extension, or the file is not in `src/assets/`. |
| Works on Windows, empty or failing on the server | Capitalization: folder and file names must match exactly. Category folders are lowercase. Check `git ls-files content` shows the same capitalization as the disk. |
| Search shows nothing in dev | Normal. Run `npm run build` then `npm run preview`. |
| New note not found by search | Search index is built during `npm run build`. Rebuild. |
| "Duplicate wiki name or alias" | Two published notes share a name or alias. Rename one or remove the alias. |
| Colon or special characters break the frontmatter | Wrap the value in quotes. |
| Tags not showing as a list | Use `tags: [a, b]`, not `tags: a, b`. |
| Template error after editing a page | Astro 7's compiler is strict: close every tag (`<p>`, `<div>`, ...). Two inline elements side by side need `{" "}` between them if a space is wanted. |
| Text looks different from Obsidian | Obsidian can show single line breaks as breaks; standard Markdown needs a blank line between paragraphs. |
| Tags split into duplicates | They should merge when they differ only in capitals or spaces. If two tags look alike but stay separate, check for different spelling. |

---

## 9. Rules to remember

- Only `published: true` notes are on the site.
- Category folders are lowercase and directly contain the notes (no subfolders).
- Note names are unique across the whole vault; aliases must not collide with other names.
- File names become URLs: spaces turn into dashes, letters are lowercased, and special characters are dropped. Prefer plain English names.
- Images live in `src/assets/`, never in the vault. Always write alt text.
- Run `npm run validate` before pushing.

## 10. Not built yet

From the requirements, these are still open:

- Deployment (host, domain, automatic builds). The build command is `npm run build` and the output folder is `dist/`. Use a Node version supported by Astro 7 on the host.
- Footer
- Sitemap, canonical URLs, and social-sharing meta tags
- Favicon link and 404 page
- Optional: a shortcut for body images (`![Alt](elves.jpg)` instead of the relative path)
- Optional: fixing Obsidian's single line breaks so text matches the vault
