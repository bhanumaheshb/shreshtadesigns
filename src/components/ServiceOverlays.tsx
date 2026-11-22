import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { CEREMONY_SLIDES, type CeremonyId } from '../data/ceremonies';
import { ConsultationForm } from './ConsultationForm';

interface InquiryModalProps {
  open: boolean;
  initialCeremony: CeremonyId;
  onClose: () => void;
}

export function InquiryModal({ open, initialCeremony, onClose }: InquiryModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<CeremonyId[]>([initialCeremony]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    setSelected([initialCeremony]);
    dialog.showModal();
    return () => dialog.close();
  }, [open, initialCeremony]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="ceremony-inquiry ceremony-inquiry__dialog"
      aria-labelledby="album-inquiry-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="album-inquiry-title" className="text-3xl">Schedule a Design Consultation</h2>
        <button type="button" onClick={onClose} aria-label="Close enquiry"
          className="ceremony-album__icon-button shrink-0">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <fieldset className="mt-4 mb-6">
        <legend className="text-sm">Ceremonies to plan</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CEREMONY_SLIDES.map(({ id, name }) => {
            const active = selected.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected((current) =>
                  active ? current.filter((item) => item !== id) : [...current, id],
                )}
                className={`cursor-pointer border px-3 py-2 text-xs transition-colors ${
                  active
                    ? 'border-[var(--ceremony-burgundy)] bg-[var(--ceremony-burgundy)] text-[var(--ceremony-paper)]'
                    : 'border-[var(--ceremony-rule)] hover:bg-[var(--ceremony-surface)]'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <ConsultationForm ceremonies={selected} />
    </dialog>
  );
}
