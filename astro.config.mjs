// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { unified } from "@astrojs/markdown-remark";
import remarkWikilinks from "./plugins/remark-wikilinks.mjs";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    processor: unified({ remarkPlugins: [remarkWikilinks] }),
  },
});