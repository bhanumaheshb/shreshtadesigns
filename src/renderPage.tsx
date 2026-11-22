import { WhatsAppLink } from './components/WhatsAppLink';
import { BRAND_LOGO_URL, BRAND_NAME } from './data/brand';
import type { SitePage } from './data/pages';

export async function renderPage(page: SitePage) {
  let content;
  switch (page.kind) {
    case 'home': {
      const { default: Landing } = await import('./App');
      content = <Landing logoSrc={BRAND_LOGO_URL} />;
      break;
    }
    case 'services': {
      const { ServicesPage } = await import('./components/ServicesPage');
      content = <ServicesPage logoSrc={BRAND_LOGO_URL} />;
      break;
    }
    case 'studio': {
      const { StudioPage } = await import('./components/StudioPage');
      content = <StudioPage page={page.link} logoSrc={BRAND_LOGO_URL} />;
      break;
    }
    case 'album': {
      const { AlbumRoute } = await import('./components/AlbumRoute');
      content = <AlbumRoute slide={page.slide} logoSrc={BRAND_LOGO_URL} />;
      break;
    }
    case 'missing':
      content = (
        <main id="main-content" tabIndex={-1} className="missing-page">
          <h1>Page unavailable</h1>
          <p><a href="/">Return to the {BRAND_NAME} homepage</a></p>
          <p><a href="/services/">Explore wedding services</a></p>
        </main>
      );
      break;
  }
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {content}
      <WhatsAppLink />
    </>
  );
}
