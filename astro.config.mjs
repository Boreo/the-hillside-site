// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';

import sitemap from '@astrojs/sitemap';
import remarkDeflist from 'remark-deflist';
import rehypePhotoRuns from './src/lib/rehype-photo-runs.mjs';
import rehypePolicyPage from './src/lib/rehype-policy-page.mjs';
import rehypeFaqPage from './src/lib/rehype-faq-page.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.thehillside.com.au',
  trailingSlash: 'ignore',

  integrations: [sitemap()],

  markdown: {
    processor: unified({
      // remark-deflist ships pre-unified-10 types that don't match Astro's
      // RemarkPlugin signature; the plugin itself works fine.
      remarkPlugins: [/** @type {any} */ (remarkDeflist)],
      rehypePlugins: [rehypeFaqPage, rehypePhotoRuns, rehypePolicyPage],
    }),
  },

  // Markdown images get no srcset without a default layout.
  image: { layout: 'constrained' },
});