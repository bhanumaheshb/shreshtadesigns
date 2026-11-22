import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';

// Keep the build-time renderer beside node_modules and outside the deployable tree.
const output = process.env.SITE_STAGING === '1' ? 'dist-staging' : 'dist';
const renderer = await mkdtemp(join(process.cwd(), '.prerender-'));
try {
  await build({ build: { outDir: output } });
  await build({
    publicDir: false,
    build: {
      ssr: 'src/prerender.tsx',
      outDir: renderer,
      copyPublicDir: false,
    },
  });
  const { buildPages } = await import(pathToFileURL(join(renderer, 'prerender.js')).href);
  await buildPages(output);
} finally {
  await rm(renderer, { recursive: true, force: true });
}
