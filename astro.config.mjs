// @ts-check
import { defineConfig } from 'astro/config';
import { existsSync, readdirSync } from 'node:fs';

/**
 * Build-time scan of public/assets/images/.
 * The site must render fully without any user-made images; when the user drops
 * files named per the plan (harmony-hero.webp etc.) into public/assets/images/,
 * they are picked up automatically. WebP is preferred over PNG.
 */
const heroImages = () => ({
  name: 'hero-images',
  resolveId(id) {
    if (id === 'virtual:hero-images') return '\0hero-images';
  },
  load(id) {
    if (id === '\0hero-images') {
      const dir = 'public/assets/images';
      const files = existsSync(dir) ? readdirSync(dir) : [];
      const images = files.filter((f) => /\.(webp|png)$/i.test(f));
      return `export default ${JSON.stringify(images)};`;
    }
  },
});

export default defineConfig({
  // Custom domain moipharmony.caipex.site -> root base.
  // For a temporary sub-path preview (teamprotofelix.github.io/moipharmony/)
  // before the domain is configured, change base to '/moipharmony/'.
  base: '/',
  site: 'https://moipharmony.caipex.site',
  vite: {
    plugins: [heroImages()],
  },
});
