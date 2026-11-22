import { useState } from 'react';
import type { CeremonyId, CeremonySlide } from '../data/ceremonies';
import { ceremonyServiceHref } from '../data/siteNavigation';
import { CeremonyAlbumPage } from './CeremonyAlbumPage';
import { InquiryModal } from './ServiceOverlays';

export function AlbumRoute({ slide, logoSrc }: { slide: CeremonySlide; logoSrc: string }) {
  const [inquiryOpen, setInquiryOpen] = useState(false);

  function openDetails(id: CeremonyId) {
    window.location.assign(ceremonyServiceHref(id));
  }

  return (
    <>
      <CeremonyAlbumPage
        slide={slide}
        logoSrc={logoSrc}
        inquiryOpen={inquiryOpen}
        onBackToCeremony={openDetails}
        onOpenInquiry={() => setInquiryOpen(true)}
      />
      <InquiryModal open={inquiryOpen} initialCeremony={slide.id} onClose={() => setInquiryOpen(false)} />
    </>
  );
}
