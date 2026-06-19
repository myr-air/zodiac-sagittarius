import { createPortal } from "react-dom";

import { Icon } from "@/src/ui/icons";
import type { Locale } from "@/src/i18n/types";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import type { ItineraryBookingTicketInput } from "@/src/trip/booking-docs";

import {
  ticketModalCopy,
} from "@/src/features/itinerary/domain/itinerary-item-editing";
import {
  subActivityModalCloseClassName,
  ticketModalBackdropClassName,
  ticketModalBodyClassName,
  ticketModalClassName,
  ticketModalHeaderClassName,
  ticketModalTitleClassName,
} from "../smart-itinerary-table.styles";
import { useEscapeToClose } from "./use-escape-close";
import { ItineraryTicketModalFooter } from "./ItineraryTicketModalFooter";
import {
  ExistingTicketList,
  LinkedActivitiesPicker,
  TicketFieldGrid,
  TicketModeToggle,
} from "./ItineraryTicketModalSections";
import { useItineraryTicketModalModel } from "./use-itinerary-ticket-modal-model";

export function ItineraryTicketModal({
  bookingDocs,
  bookingLinkItems,
  item,
  locale,
  onClose,
  onSave,
  onUnlink,
}: {
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  item: ItineraryItem;
  locale: Locale;
  onClose: () => void;
  onSave: (input: ItineraryBookingTicketInput) => void | Promise<void>;
  onUnlink?: (bookingDocId: string) => void | Promise<void>;
}) {
  const {
    confirmationCode,
    currentLinkedBooking,
    endsAt,
    existingCandidates,
    mode,
    notes,
    providerName,
    relatedItineraryItemIds,
    saving,
    selectExistingTicket,
    selectExistingTicketMode,
    selectNewTicketMode,
    selectedBookingId,
    setConfirmationCode,
    setEndsAt,
    setNotes,
    setProviderName,
    setRelatedItineraryItemIds,
    setStartsAt,
    setTitle,
    startsAt,
    submit,
    title,
    unlinkCurrentBooking,
    unlinking,
  } = useItineraryTicketModalModel({
    bookingDocs,
    item,
    locale,
    onSave,
    onUnlink,
  });
  const copy = ticketModalCopy(locale);

  useEscapeToClose(onClose);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={ticketModalBackdropClassName}
      role="presentation"
      onClick={onClose}
    >
      <form
        className={ticketModalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title(item.activity)}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void submit(event)}
      >
        <header className={ticketModalHeaderClassName}>
          <strong className={ticketModalTitleClassName}>
            <span>{copy.title(item.activity)}</span>
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
          <TicketModeToggle
            copy={copy}
            existingCandidatesCount={existingCandidates.length}
            mode={mode}
            onSelectExistingTicketMode={selectExistingTicketMode}
            onSelectNewTicketMode={selectNewTicketMode}
          />
          {mode === "existing" ? (
            <ExistingTicketList
              bookingLinkItems={bookingLinkItems}
              copy={copy}
              existingCandidates={existingCandidates}
              selectedBookingId={selectedBookingId}
              onSelectExistingTicket={selectExistingTicket}
            />
          ) : null}
          <TicketFieldGrid
            confirmationCode={confirmationCode}
            copy={copy}
            endsAt={endsAt}
            notes={notes}
            providerName={providerName}
            startsAt={startsAt}
            title={title}
            onConfirmationCodeChange={setConfirmationCode}
            onEndsAtChange={setEndsAt}
            onNotesChange={setNotes}
            onProviderNameChange={setProviderName}
            onStartsAtChange={setStartsAt}
            onTitleChange={setTitle}
          />
          <LinkedActivitiesPicker
            bookingLinkItems={bookingLinkItems}
            copy={copy}
            itemId={item.id}
            relatedItineraryItemIds={relatedItineraryItemIds}
            onRelatedItineraryItemIdsChange={setRelatedItineraryItemIds}
          />
        </div>
        <ItineraryTicketModalFooter
          copy={copy}
          currentLinkedBooking={currentLinkedBooking}
          mode={mode}
          onClose={onClose}
          onUnlink={onUnlink ? () => void unlinkCurrentBooking() : undefined}
          saving={saving}
          selectedBookingId={selectedBookingId}
          title={title}
          unlinking={unlinking}
        />
      </form>
    </div>,
    document.body,
  );
}
