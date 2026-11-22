import { createRoot, hydrateRoot } from 'react-dom/client';
import { BRAND_NAME } from './data/brand';
import { findPage, legacyPageHref } from './data/pages';
import { renderPage } from './renderPage';
import './index.css';

async function start() {
  if (location.pathname === '/') {
    const redirectLegacyLink = () => {
      const href = legacyPageHref(location.hash);
      if (href) location.replace(href);
      return Boolean(href);
    };
    if (redirectLegacyLink()) return;
    window.addEventListener('hashchange', redirectLegacyLink);
  }

  const root = document.getElementById('root')!;
  const page = findPage(location.pathname);
  const content = await renderPage(page);
  if (root.hasChildNodes()) {
    hydrateRoot(root, content);
  } else {
    document.title = `${page.title} | ${BRAND_NAME}`;
    createRoot(root).render(content);
  }
}

void start();
