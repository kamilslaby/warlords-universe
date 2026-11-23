# Lore Wiki: Requirements (v1)

A public, text-first wiki for the lore of an original IP. Author-only, English only, static site.

## 1. Stack

- Astro (static output) + Tailwind CSS (with the typography plugin)
- Pagefind for search, run as a post-build step
- Code in a GitHub repo, deployed to a static host

## 2. Content source

- The Obsidian vault is copied into `content/` in the repo.
- Astro content collections read from `content/` (glob loader, `base: "./content"`).
- Entry type comes from the top-level folder: `races/`, `factions/`, `locations/`. More folders can be added later as new collections.
- Image files are **not** in the vault. They live in `src/assets/`.

## 3. Publishing rule

- Only notes with `published: true` are built, listed, linked, and indexed by Pagefind.
- A missing `published` field means `false`.

## 4. Frontmatter (shared by all types)

```yaml
---
published: true
summary: One line used in search results and link previews.
aliases: []
tags: []
image: ../../src/assets/factions/iron-legion.jpg
imageAlt: Banner of the Iron Legion
---
```

| Field | Required | Notes |
|---|---|---|
| `published` | yes (to appear) | Defaults to `false` |
| `summary` | yes, if published | Used in search results and link previews |
| `aliases` | no | Searchable and resolvable in `[[links]]` |
| `tags` | no | Used for tag pages |
| `image` | no | Validated with Astro's `image()` helper |
| `imageAlt` | required if `image` is set | |

- **Title** comes from the file name (no `title` field).
- **Type** comes from the folder (no `type` field).
- Type-specific infobox fields (e.g. a faction's leader) are **postponed**. They can be added later as optional fields.

## 5. Links

- Obsidian `[[note name]]` links are converted to page links (via a small remark plugin), resolved against file names and aliases.
- A link to an unpublished or missing note renders as plain text (no leaks, no 404s).
- Note names must be **unique across the whole vault**. The build fails on duplicates.
- URL slugs are generated from file names (e.g. `Iron Legion.md` becomes `/factions/iron-legion/`).
- Backlinks: each article shows "Pages that link here".

## 6. Markdown features

- Standard Markdown: headings, lists, `>` blockquotes, fenced code blocks.
- Quote convention (works in Obsidian and on the site):

  ```md
  > The mountains remember what the kings forget.
  >
  > *— Elder Varn, Keeper of the Pass*
  ```

- Body images use standard Markdown image syntax with a relative path to `src/assets/`, e.g. `![Alt text](../../src/assets/races/elves.jpg)`. Astro optimizes them at build time. A wrong path fails the build.
- Notes stay `.md` (not `.mdx`) so the vault keeps working in Obsidian.

## 7. Pages and navigation

- Home page
- Index page per type (races, factions, locations)
- Tag pages
- Breadcrumbs
- Article page: text-first layout, table of contents, infobox with the entry image (`<Image />`), aliases, tags, and type
- Backlinks section on every article
- Mix of discovery paths: search, browsing by category, and following links

## 8. Search

- Pagefind with a keyboard shortcut to open it (`/` or Ctrl+K)
- Filter by type
- Aliases are searchable
- Only published pages are indexed

## 9. Design and basics

- One design, **light mode only**
- Responsive (mobile-first)
- Per-page meta tags, sitemap, canonical URLs
- Semantic HTML, required alt text for images

## 10. Build-time validation

- Duplicate note names or aliases
- Missing or invalid image paths
- Published notes missing `summary`
- `imageAlt` missing when `image` is set

## 11. Out of scope (v1)

- Comments, user accounts, contributors, CMS
- Translations
- Spoiler system
- Dark mode
- Timeline, maps, relationship graphs
- Type-specific infobox fields
- Obsidian-only syntax such as `![[embeds]]`, callouts, and Dataview

## 12. Open items (decide later)

- Whether to add a remark plugin so body images can be written as `![Alt](elves.jpg)` instead of a relative path
- Whether to fix Obsidian's single line breaks so text looks the same on the site
- Hosting provider and domain
