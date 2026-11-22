import type { GalleryImage, GallerySection } from '../components/ui/shadcn-studio-gallery-component-01';
import type { CeremonyId } from './ceremonies';

const imageRoot = '/src/assets/images/';

function albumImage(ceremony: CeremonyId, name: string, alt: string, hasPreview = false): GalleryImage {
  const path = `${imageRoot}albums/${ceremony}/${name}`;
  return {
    src: `${path}.webp`,
    alt,
    previewSrc: hasPreview ? `${path}-preview.webp` : undefined,
  };
}

export const ALBUM_COVERS: Record<CeremonyId, GalleryImage> = {
  engagement: {
    src: imageRoot + 'album_engagement_hero_1795088227985.webp',
    alt: 'Twilight courtyard ring exchange beneath strings of lights',
  },
  sangeet: {
    src: imageRoot + 'album_sangeet_hero_1795088227933.webp',
    alt: 'Sangeet performance on an illuminated mirrorwork stage',
  },
  haldi: {
    src: imageRoot + 'album_haldi_hero_1795088227114.webp',
    alt: 'A Haldi celebration in a sunlit courtyard filled with marigolds',
  },
  wedding: {
    src: imageRoot + 'temple_wedding_mandap_1795089784740.webp',
    alt: 'Carved sandstone wedding mandap with jasmine garlands, brass lamps and a woven aisle',
  },
  reception: albumImage('reception', 'reception-ballroom', 'Reception ballroom with chandelier lighting, dinner tables and an ivory floral stage'),
};

const ALBUM_SHOTS = {
  engagement: [
    ['convention-hall', 'Convention hall engagement stage with ivory flowers, pale green drapes and rows of covered chairs'],
    ['champagne-stage', 'Engagement stage with a taupe settee and white orchids against a fluted backdrop'],
    ['ring-tray', 'Gold engagement rings on slate-blue velvet beside jasmine and rose petals'],
    ['courtyard-aisle', 'Courtyard engagement aisle lined with white flowers and glass lanterns'],
    ['foyer-flowers', 'Convention hall entrance with garden roses, terracotta vases and a welcome table'],
    ['candlelit-tables', 'Candlelit engagement dinner table with pink carnations and neutral linens'],
    ['floral-installation', 'Engagement floral arch with ivory orchids, pink roses and leafy branches'],
    ['engagement-toast', 'Engagement guests raising a toast beneath warm ballroom lights'],
    ['sage-ballroom', 'Sage and ivory engagement stage with floral arrangements and upholstered guest seating'],
  ],
  sangeet: [
    ['dance-floor', 'Parquet Sangeet dance floor beneath amber stage lights and maroon drapery'],
    ['dhol-player', 'Dhol player with a tasseled wooden drum on the Sangeet dance floor'],
    ['performance-rehearsal', 'Wedding guests rehearsing a Sangeet dance in embroidered outfits'],
    ['lounge', 'Sangeet lounge with teal seating, brass side tables and dark blue curtains'],
    ['lighting-rig', 'Sangeet stage lighting and truss beside the performance floor'],
    ['tabla-detail', 'Tabla drums and small cymbals on a red woven rug'],
    ['courtyard-stage', 'Outdoor Sangeet stage in a heritage courtyard at blue hour'],
    ['artist-corner', 'Dhol drums ready beside plum curtains at the side of the stage'],
    ['night-celebration', 'Sangeet guests dancing in jewel-toned outfits under warm spotlights'],
  ],
  haldi: [
    ['marigold-courtyard', 'Sunlit Haldi courtyard with a yellow seat, marigold strings and a white canopy'],
    ['turmeric-thali', 'Brass dish of turmeric paste with marigolds and folded cotton'],
    ['flower-canopy', 'Haldi bench beneath hanging flowers against a pale courtyard wall'],
    ['jasmine-and-urli', 'Jasmine and marigold petals floating in a brass urli'],
    ['seated-bride', 'Bride in a mustard sari laughing with family at her Haldi ceremony'],
    ['garden-lounge', 'Outdoor Haldi lounge with cane chairs and yellow cushions beneath a cream marquee'],
    ['petal-baskets', 'Baskets of yellow and orange marigold petals on linen'],
    ['mango-leaf-entry', 'Courtyard entrance dressed with mango leaves, marigolds and brass vessels'],
    ['sunlit-haldi-stage', 'Sunlit Haldi stage with yellow seating, a cream canopy and terracotta pots'],
  ],
  wedding: [
    ['timber-mandap', 'Dark timber mandap dressed in jasmine and red roses at the end of a woven aisle'],
    ['brass-lamps', 'Lit brass lamps beside a mandap pillar and jasmine flowers'],
    ['processional-aisle', 'Indoor wedding aisle with white drapes, beige chairs and red and white florals'],
    ['ritual-vessels', 'Copper wedding ritual vessels, mango leaves and a coconut on an embroidered cloth'],
    ['garland-detail', 'Jasmine and red rose wedding garlands draped over a carved stool'],
    ['vows-under-mandap', 'Wedding couple seated with a priest beneath a flower-draped mandap'],
    ['entrance-drapery', 'Wedding entrance with ivory drapes, dark columns and brass vessels'],
    ['woven-seating', 'Wicker guest seating and patterned floor runner beside the mandap'],
    ['mandap-blue-hour', 'Jasmine-draped mandap in a sandstone courtyard under evening lamps'],
  ],
  reception: [
    ['floral-sofa-stage', 'Beige reception settee beneath a burgundy floral installation'],
    ['head-table', 'Reception head table with ivory roses, wine-coloured napkins and candleholders'],
    ['dance-floor', 'Reception dance floor and live music platform under amber lighting'],
    ['dessert-table', 'Reception dessert table with pastries and a tiered cake'],
    ['couple-entrance', 'Newlyweds entering a reception ballroom through pale drapes'],
    ['garden-banquet', 'Twilight garden reception with long tables and festoon lights'],
    ['glass-and-florals', 'Fluted reception glassware beside ivory orchids and dark dahlias'],
    ['ballroom-balcony', 'Balcony view of a reception ballroom with candlelit tables and a marble dance floor'],
  ],
} satisfies Record<CeremonyId, [string, string][]>;

export function ceremonyGallery(ceremony: CeremonyId): GallerySection[] {
  const photos = ALBUM_SHOTS[ceremony].map(([name, alt], index) => albumImage(ceremony, name, alt, index < 8));
  const closingPhoto = photos[8];

  return [
    { type: 'single', images: [ALBUM_COVERS[ceremony]] },
    { type: 'grid', images: photos.slice(0, 4) },
    { type: 'grid', images: photos.slice(4, 8) },
    ...(closingPhoto ? [{ type: 'single' as const, images: [closingPhoto] }] : []),
  ];
}
