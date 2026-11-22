import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { BRAND_LOGO_URL, BRAND_NAME } from './data/brand';
import { notFound, pages, SITE_ORIGIN, type SitePage } from './data/pages';
import { renderPage } from './renderPage';

const organizationId = SITE_ORIGIN + '/#organization';
const websiteId = SITE_ORIGIN + '/#website';

function schemaFor(page: SitePage) {
  const organization = {
    '@type': 'Organization',
    '@id': organizationId,
    name: BRAND_NAME,
    url: SITE_ORIGIN + '/',
    logo: SITE_ORIGIN + BRAND_LOGO_URL,
    email: 'info@shreshtadesigns.com',
    areaServed: { '@type': 'City', name: 'Hyderabad' },
  };

  const graph: object[] = [organization, {
    '@type': 'WebSite',
    '@id': websiteId,
    name: BRAND_NAME,
    url: SITE_ORIGIN + '/',
    inLanguage: 'en-IN',
    publisher: { '@id': organizationId },
  }];

  if (page.kind === 'services') {
    graph.push({
      '@type': 'Service',
      name: 'Wedding planning and design',
      serviceType: 'Wedding planning, wedding design and wedding event management',
      url: SITE_ORIGIN + page.path,
      description: page.description,
      provider: { '@id': organizationId },
      areaServed: { '@type': 'City', name: 'Hyderabad' },
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

function pageHead(page: SitePage, staging: boolean) {
  const title = `${page.title} | ${BRAND_NAME}`;
  const url = SITE_ORIGIN + page.path;
  const image = SITE_ORIGIN + page.image;
  const indexable = page.kind !== 'missing' && !staging;
  return renderToStaticMarkup(
    <>
      <title>{title}</title>
      <meta name="description" content={page.description} />
      {indexable && <link rel="canonical" href={url} />}
      <meta name="robots" content={indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:site_name" content={BRAND_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={page.description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={page.description} />
      <meta name="twitter:image" content={image} />
      {page.kind !== 'missing' && <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaFor(page)).replace(/</g, '\\u003c'),
      }} />}
    </>
  );
}

export async function buildPages(directory: string) {
  const staging = process.env.SITE_STAGING === '1';
  const template = await readFile(join(directory, 'index.html'), 'utf8');
  const headPlaceholder = /<title>[^<]*<\/title><!--page-head-->/;
  if (!headPlaceholder.test(template) || !template.includes('<div id="root"></div>')) {
    throw new Error('Expected page head and React root in the built template.');
  }

  for (const page of [...pages, notFound]) {
    const path = page.kind === 'missing' ? '404.html' : page.path.slice(1) + 'index.html';
    const file = join(directory, path);
    const markup = renderToString(await renderPage(page));
    const html = template
      .replace(headPlaceholder, () => pageHead(page, staging))
      .replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }

  const sitemap = stageSitemap(staging);
  if (sitemap) await writeFile(join(directory, 'sitemap.xml'), sitemap);
  await writeFile(join(directory, 'robots.txt'), staging ? 'User-agent: *\nDisallow: /\n' : [
    'User-agent: *',
    'Disallow: /api/',
    '',
    'User-agent: GPTBot',
    'Disallow: /',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n'));
}

function stageSitemap(staging: boolean) {
  if (staging) return '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(({ path }) => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`).join('\n')}\n</urlset>\n`;
}
