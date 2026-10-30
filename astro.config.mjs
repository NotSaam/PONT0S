// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Por defecto, en la raíz de https://pont0s.vercel.app. En GitHub Pages de proyecto: BASE_PATH=/PONT0S.
// Con dominio propio: SITE_URL=https://midominio.
const site = process.env.SITE_URL ?? 'https://pont0s.vercel.app';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  compressHTML: true,
  integrations: [sitemap()],
  build: { format: 'directory' },
});
