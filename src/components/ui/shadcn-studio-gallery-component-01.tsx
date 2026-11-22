import { cn } from '@/src/lib/utils';

export interface GalleryImage {
  src: string;
  alt: string;
  previewSrc?: string;
}

export interface GallerySection {
  /** `grid` renders the images in a two-column grid, otherwise they stack. */
  type?: 'single' | 'grid';
  images: GalleryImage[];
}

export interface GalleryComponent01Props {
  sections: GallerySection[];
  onImageClick: (image: GalleryImage, flatIndex: number) => void;
}

const GalleryComponent01 = ({ sections, onImageClick }: GalleryComponent01Props) => {
  let runningIndex = 0;

  return (
    <div className="grid gap-3 sm:gap-6 min-[720px]:grid-cols-2">
      {sections.map((section, sectionIndex) => {
        const grid = section.type === 'grid';
        const lastFullRow = grid && sectionIndex === sections.length - 1 && sectionIndex % 2 === 0;

        return (
          <div
            key={sectionIndex}
            className={cn(
              grid && 'grid grid-cols-2 gap-3 sm:gap-6',
              lastFullRow && 'min-[720px]:col-span-2 min-[720px]:grid-cols-4',
            )}
          >
            {section.images.map((image) => {
              const flatIndex = runningIndex++;
              return (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => onImageClick(image, flatIndex)}
                  aria-label={`Inspect ${image.alt}`}
                  className={cn(
                    'group block w-full cursor-zoom-in overflow-hidden bg-[var(--ceremony-surface)]',
                    grid ? 'aspect-square' : 'aspect-[4/3] min-[720px]:h-full min-[720px]:aspect-auto'
                  )}
                >
                  <img
                    src={grid ? image.previewSrc ?? image.src : image.src}
                    alt={image.alt}
                    loading={flatIndex === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
                  />
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default GalleryComponent01;
