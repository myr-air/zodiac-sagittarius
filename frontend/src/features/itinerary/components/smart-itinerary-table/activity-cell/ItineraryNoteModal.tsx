import type { Locale } from "@/src/i18n/types";
import { Icon } from "@/src/ui/icons";
import { cn } from "@/src/lib/cn";
import { subActivityModalCloseClassName } from "../smart-itinerary-table.styles";
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
          <header className={ticketModalHeaderClassName}>
            <strong className={ticketModalTitleClassName}>
              <span>{copy.title}</span>
              <small>{copy.subtitle}</small>
            </strong>
            <button
              type="button"
              className={subActivityModalCloseClassName}
              aria-label={copy.close}
              onClick={onClose}
            >
              <Icon name="x" />
            </button>
          </header>
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
            <button
              type="button"
              className={ticketModalCancelButtonClassName}
              onClick={onClose}
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              className={noteModalSaveButtonClassName}
              disabled={saving || !body.trim()}
            >
              <Icon name="note" />
              {copy.save}
            </button>
          </footer>
        </form>
      </div>
    </ActivityCellModalPortal>
  );
}
