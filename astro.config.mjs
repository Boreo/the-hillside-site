// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import remarkDeflist from 'remark-deflist';
import rehypePhotoRuns from './src/lib/rehype-photo-runs.mjs';
import rehypePolicyPage from './src/lib/rehype-policy-page.mjs';
import rehypeFaqPage from './src/lib/rehype-faq-page.mjs';

const isDev = process.argv.includes('dev');

// https://astro.build/config
export default defineConfig({
  site: 'https://www.thehillside.com.au',
  trailingSlash: 'ignore',

  integrations: [sitemap()],

  redirects: {
    // legacy Squarespace paths
    '/home': '/',
    '/further-inform': '/location/',
  },

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

  // 'compile' processes images with sharp at build time, so the static
  // output needs no Cloudflare Images binding or runtime /_image endpoint.
  adapter: isDev ? undefined : cloudflare({ imageService: 'compile' }),
});