import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    build: { cssCodeSplit: false, copyPublicDir: false },
    plugins: [
      react(),
      tailwindcss(),
      // Deploy the existing public images and the PHP enquiry handler only.
      {
        name: 'copy-deployable-files',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error || this.environment.config.build.ssr) {
            return;
          }
          const distDir = path.resolve(import.meta.dirname, this.environment.config.build.outDir);
          const copy = (source: string, destination = source, filter?: (source: string) => boolean) => {
            const target = path.join(distDir, destination);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.cpSync(path.join(import.meta.dirname, source), target, { recursive: true, filter });
          };
          copy('src/assets/images', 'src/assets/images', (source) =>
            !/^(?:mountain_sunset_vista_|serene_alpine_blue_vista_).+\.jpg$/.test(path.basename(source)),
          );
          const htmlCache = process.env.SITE_STAGING === '1'
            ? 'private, no-store'
            : 'public, max-age=0, s-maxage=300';
          const hostingRules = fs.readFileSync(path.join(import.meta.dirname, 'public/.htaccess'), 'utf8');
          fs.writeFileSync(path.join(distDir, '.htaccess'), hostingRules.replace('__STATIC_HTML_CACHE__', htmlCache));
          copy('public/api/consultation.php', 'api/consultation.php');
          copy('public/assets/aistudio/golden-pavilion.webp', 'assets/aistudio/golden-pavilion.webp');
          copy('public/assets/aistudio/golden-pavilion-portrait.webp', 'assets/aistudio/golden-pavilion-portrait.webp');
          copy('public/assets/aistudio/shreshta-logo.webp', 'assets/aistudio/shreshta-logo.webp');
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    ssr: { noExternal: ['gsap'] },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
