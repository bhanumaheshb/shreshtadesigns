import { accessSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { consultationRouter } from './scripts/consultation.mjs';

const staging = process.env.SITE_STAGING === '1';
const root = fileURLToPath(new URL(staging ? './dist-staging/' : './dist/', import.meta.url));
accessSync(join(root, 'index.html'));

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'",
  });
  next();
});

app.use('/api/consultation', consultationRouter());
app.use('/api', (_req, res) => res.status(404).set('Cache-Control', 'no-store').json({ error: 'Not found.' }));

app.use(express.static(root, {
  dotfiles: 'deny',
  setHeaders(res, path) {
    if (/-[A-Za-z0-9_-]{8}\.(?:js|css|png|webp)$/.test(path)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.endsWith('index.html')) {
      res.setHeader('Cache-Control', staging ? 'private, no-store' : 'public, max-age=0, s-maxage=300');
    } else if (/\.(?:webp|jpe?g|png)$/.test(path)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  },
}));
app.use((_req, res) => res.status(404).set('Cache-Control', 'no-store').sendFile(join(root, '404.html')));

const port = Number(process.env.PORT ?? 3000);
app.listen(port, '0.0.0.0', () => console.log(`Shreshta Designs listening on port ${port}`));
