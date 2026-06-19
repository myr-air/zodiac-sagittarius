import { createPortal } from "react-dom";

import { DateTimePickerField } from "@/src/shared/components/date-time-pickers";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { Locale } from "@/src/i18n/types";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import type { ItineraryBookingTicketInput } from "@/src/trip/booking-docs";

import {
  formatBookingSummary,
  ticketModalCopy,
} from "@/src/features/itinerary/domain/itinerary-item-editing";
import { toggleId } from "@/src/features/itinerary/lib";
import {
  subActivityModalCloseClassName,
  ticketExistingGridClassName,
  ticketExistingOptionClassName,
  ticketFieldClassName,
  ticketFieldGridClassName,
  ticketLinkedItemsClassName,
  ticketLinkedOptionClassName,
  ticketModalBackdropClassName,
  ticketModalBodyClassName,
  ticketModalClassName,
  ticketModalHeaderClassName,
  ticketModalTitleClassName,
  ticketModeButtonClassName,
  ticketModeToggleClassName,
} from "../smart-itinerary-table.styles";
import { useEscapeToClose } from "./use-escape-close";
import { ItineraryTicketModalFooter } from "./ItineraryTicketModalFooter";
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
          <div className={ticketModeToggleClassName}>
            <button
              type="button"
              className={ticketModeButtonClassName}
              aria-pressed={mode === "new"}
              onClick={selectNewTicketMode}
            >
              <Icon name="plus" /> {copy.newTicket}
            </button>
            <button
              type="button"
              className={ticketModeButtonClassName}
              aria-pressed={mode === "existing"}
              disabled={!existingCandidates.length}
              onClick={selectExistingTicketMode}
            >
              <Icon name="ticket" /> {copy.useExisting}
            </button>
          </div>
          {mode === "existing" ? (
            <div
              className={ticketExistingGridClassName}
              role="radiogroup"
              aria-label={copy.existingTickets}
            >
              {existingCandidates.map((booking) => (
                <label className={ticketExistingOptionClassName} key={booking.id}>
                  <input
                    type="radio"
                    checked={selectedBookingId === booking.id}
                    onChange={() => selectExistingTicket(booking)}
                  />
                  <span>
                    <strong>{booking.title}</strong>
                    <span>
                      {formatBookingSummary(booking, bookingLinkItems)}
                    </span>
                  </span>
                </label>
              ))}
              {!existingCandidates.length ? (
                <p className="m-0 text-xs font-bold text-(--color-text-muted)">
                  {copy.noExisting}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className={ticketFieldGridClassName}>
            <label className={ticketFieldClassName}>
              <span>{copy.ticketTitle}</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className={ticketFieldClassName}>
              <span>{copy.provider}</span>
              <input value={providerName} onChange={(event) => setProviderName(event.target.value)} />
            </label>
            <label className={ticketFieldClassName}>
              <span>{copy.confirmation}</span>
              <input value={confirmationCode} onChange={(event) => setConfirmationCode(event.target.value)} />
            </label>
            <label className={ticketFieldClassName}>
              <span>{copy.startsAt}</span>
              <DateTimePickerField value={startsAt} onChange={setStartsAt} />
            </label>
            <label className={ticketFieldClassName}>
              <span>{copy.endsAt}</span>
              <DateTimePickerField value={endsAt} onChange={setEndsAt} />
            </label>
            <label className={cn(ticketFieldClassName, "col-span-full")}>
              <span>{copy.notes}</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
          </div>
          <section className="grid gap-1.5" aria-label={copy.linkedActivities}>
            <strong className="text-xs font-extrabold text-(--color-text-muted)">
              {copy.linkedActivities}
            </strong>
            <div className={ticketLinkedItemsClassName}>
              {bookingLinkItems.map((candidate) => (
                <label className={ticketLinkedOptionClassName} key={candidate.id}>
                  <input
                    type="checkbox"
                    checked={relatedItineraryItemIds.includes(candidate.id)}
                    disabled={candidate.id === item.id}
                    onChange={() =>
                      setRelatedItineraryItemIds((current: string[]) =>
                        toggleId(current, candidate.id),
                      )
                    }
                  />
                  <span>{candidate.day} · {candidate.activity}</span>
                </label>
              ))}
            </div>
          </section>
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
