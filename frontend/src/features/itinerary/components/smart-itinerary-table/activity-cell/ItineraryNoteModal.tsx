import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import {
  noteModalSaveButtonClassName,
  ticketModalCancelButtonClassName,
  ticketFieldClassName,
  ticketModalBackdropClassName,
  ticketModalBodyClassName,
  ticketModalClassName,
  ticketModalFooterClassName,
  ticketModalHeaderClassName,
  ticketModalTitleClassName,
} from "../smart-itinerary-table.styles";
import type { ItineraryItem } from "@/src/trip/types";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import { ActivityCellModalActions } from "./ActivityCellModalActions";
import { ActivityCellModalHeader } from "./ActivityCellModalHeader";
import { ActivityCellModalPortal } from "./ActivityCellModalPortal";
import { useItineraryNoteModalModel } from "./use-itinerary-note-modal-model";

export function ItineraryNoteModal({
  item,
  locale,
  onClose,
  onSave,
}: {
  item: ItineraryItem;
  locale: Locale;
  onClose: () => void;
  onSave: (body: string) => ItineraryAsyncVoidResult;
}) {
  const { body, copy, saving, setBody, submit } = useItineraryNoteModalModel({
    item,
    locale,
    onSave,
  });

  return (
    <ActivityCellModalPortal
      backdropClassName={ticketModalBackdropClassName}
      onClose={onClose}
    >
      <div
        className={cn(ticketModalClassName, "max-w-[480px]")}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        onClick={(event) => event.stopPropagation()}
      >
        <form className="contents" onSubmit={(event) => void submit(event)}>
          <ActivityCellModalHeader
            closeLabel={copy.close}
            headerClassName={ticketModalHeaderClassName}
            onClose={onClose}
            subtitle={copy.subtitle}
            title={copy.title}
            titleClassName={ticketModalTitleClassName}
          />
          <div className={ticketModalBodyClassName}>
            <label className={cn(ticketFieldClassName, "col-span-full")}>
              <span>{copy.label}</span>
              <textarea
                autoFocus
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={copy.placeholder}
              />
            </label>
          </div>
          <footer className={ticketModalFooterClassName}>
            <ActivityCellModalActions
              cancelClassName={ticketModalCancelButtonClassName}
              cancelLabel={copy.cancel}
              onCancel={onClose}
              saveClassName={noteModalSaveButtonClassName}
              saveDisabled={saving || !body.trim()}
              saveIconName="note"
              saveLabel={copy.save}
            />
          </footer>
        </form>
      </div>
    </ActivityCellModalPortal>
  );
}
