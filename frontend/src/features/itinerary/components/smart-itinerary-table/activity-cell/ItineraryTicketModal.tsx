import type { Locale } from "@/src/i18n/types";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import type { ItineraryBookingTicketInput } from "@/src/trip/booking-docs";

import {
  ticketModalCopy,
} from "@/src/features/itinerary/domain/itinerary-item-editing";
import {
  ticketModalBackdropClassName,
  ticketModalBodyClassName,
  ticketModalClassName,
  ticketModalHeaderClassName,
  ticketModalTitleClassName,
} from "../smart-itinerary-table.styles";
import { ActivityCellModalHeader } from "./ActivityCellModalHeader";
import { ExistingTicketList } from "./ExistingTicketList";
import { ItineraryTicketModalFooter } from "./ItineraryTicketModalFooter";
import { LinkedActivitiesPicker } from "./LinkedActivitiesPicker";
import { TicketFieldGrid } from "./TicketFieldGrid";
import { TicketModeToggle } from "./TicketModeToggle";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import { ActivityCellModalPortal } from "./ActivityCellModalPortal";
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
  onSave: (input: ItineraryBookingTicketInput) => ItineraryAsyncVoidResult;
  onUnlink?: (bookingDocId: string) => ItineraryAsyncVoidResult;
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

  return (
    <ActivityCellModalPortal
      backdropClassName={ticketModalBackdropClassName}
      onClose={onClose}
    >
      <form
        className={ticketModalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title(item.activity)}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void submit(event)}
      >
        <ActivityCellModalHeader
          closeLabel={copy.close}
          headerClassName={ticketModalHeaderClassName}
          onClose={onClose}
          subtitle={copy.subtitle}
          title={copy.title(item.activity)}
          titleClassName={ticketModalTitleClassName}
        />
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
    </ActivityCellModalPortal>
  );
}
