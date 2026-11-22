import { BRAND_NAME } from './brand';
import { ALBUM_COVERS } from './ceremonyGallery';
import { CEREMONY_SLIDES } from './ceremonies';
import { ceremonyAlbumHref, SERVICES_HREF, STUDIO_LINKS } from './siteNavigation';

export const SITE_ORIGIN = 'https://shreshtadesigns.com';
export const OPENING_PHOTO = '/src/assets/images/album_engagement_hero_1795088227985.webp';
export const OPENING_PHOTO_SMALL = '/src/assets/images/album_engagement_hero_720.webp';

const studioDescriptions = {
  'our-story': `Meet ${BRAND_NAME}, a Hyderabad wedding design studio bringing mandap architecture, florals and lighting together around your ceremony.`,
  experiences: 'Explore how our Hyderabad studio designs wedding spaces, from carved mandaps and floral installations to lighting, music and the guest experience.',
  celebrations: 'Find design inspiration for five Indian wedding celebrations: Engagement, Sangeet, Haldi, Wedding and Reception.',
  'our-approach': `See how ${BRAND_NAME} plans and produces weddings in Hyderabad, from your first consultation and design boards to on-site coordination.`,
  enquire: `Enquire with ${BRAND_NAME} in Hyderabad. Share your wedding date, guest count, venue ideas and vision for a private consultation.`,
};

export const pages = [
  {
    kind: 'home',
    path: '/',
    title: 'Wedding & Event Planners in Hyderabad',
    description: `${BRAND_NAME} plans and designs weddings in Hyderabad, with bespoke mandaps, florals, lighting and coordination across five wedding celebrations.`,
    image: OPENING_PHOTO,
  },
  {
    kind: 'services',
    path: SERVICES_HREF,
    title: 'Wedding Planning & Design Services in Hyderabad',
    description: 'Explore wedding planning and event design for Engagement, Sangeet, Haldi, Wedding and Reception. See the designs and timeline for each ceremony.',
    image: OPENING_PHOTO,
  },
  ...STUDIO_LINKS.map((link) => ({
    kind: 'studio' as const,
    path: link.href,
    title: link.id === 'enquire' ? 'Enquire About Your Wedding in Hyderabad' : link.label,
    description: studioDescriptions[link.id],
    image: '/src/assets/images/our-story-wedding-portrait.webp',
    link,
  })),
  ...CEREMONY_SLIDES.map((slide) => ({
    kind: 'album' as const,
    path: ceremonyAlbumHref(slide.id),
    title: `${slide.name} Design Album`,
    description: slide.album.storyLead,
    image: ALBUM_COVERS[slide.id].src,
    slide,
  })),
] as const;

export const notFound = {
  kind: 'missing',
  path: '/404.html',
  title: 'Page unavailable',
  description: `Return to ${BRAND_NAME} to browse our wedding services and albums.`,
  image: OPENING_PHOTO,
} as const;

export type SitePage = (typeof pages)[number] | typeof notFound;

export function findPage(path: string): SitePage {
  const normalized = path === '/' || path.endsWith('/') ? path : path + '/';
  return pages.find((page) => page.path === normalized) ?? notFound;
}

export function legacyPageHref(hash: string) {
  if (!hash.startsWith('#/')) return;
  const direct = pages.find((page) => page.path === hash.slice(1).replace(/\/?$/, '/'));
  if (direct && direct.path !== '/') return direct.path;
  const id = hash.match(/^#\/(?:services|ceremony)\/([a-z]+)\/?$/)?.[1];
  const ceremony = CEREMONY_SLIDES.find((slide) => slide.id === id);
  return ceremony ? `${SERVICES_HREF}#service-${ceremony.id}` : undefined;
}
