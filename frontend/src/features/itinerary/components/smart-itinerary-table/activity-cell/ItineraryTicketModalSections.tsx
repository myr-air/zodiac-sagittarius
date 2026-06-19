import { DateTimePickerField } from "@/src/shared/components/date-time-pickers";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import type { ticketModalCopy } from "@/src/features/itinerary/domain/itinerary-item-editing";
import { formatBookingSummary } from "@/src/features/itinerary/domain/itinerary-item-editing";
import { toggleId } from "@/src/features/itinerary/lib";
import {
  ticketExistingGridClassName,
  ticketExistingOptionClassName,
  ticketFieldClassName,
  ticketFieldGridClassName,
  ticketLinkedItemsClassName,
  ticketLinkedOptionClassName,
  ticketModeButtonClassName,
  ticketModeToggleClassName,
} from "../smart-itinerary-table.styles";
import type { TicketFormMode } from "./booking-ticket-form";

type TicketModalCopy = ReturnType<typeof ticketModalCopy>;

interface TicketModeToggleProps {
  copy: TicketModalCopy;
  existingCandidatesCount: number;
  mode: TicketFormMode;
  onSelectExistingTicketMode: () => void;
  onSelectNewTicketMode: () => void;
}

export function TicketModeToggle({
  copy,
  existingCandidatesCount,
  mode,
  onSelectExistingTicketMode,
  onSelectNewTicketMode,
}: TicketModeToggleProps) {
  return (
    <div className={ticketModeToggleClassName}>
      <button
        type="button"
        className={ticketModeButtonClassName}
        aria-pressed={mode === "new"}
        onClick={onSelectNewTicketMode}
      >
        <Icon name="plus" /> {copy.newTicket}
      </button>
      <button
        type="button"
        className={ticketModeButtonClassName}
        aria-pressed={mode === "existing"}
        disabled={!existingCandidatesCount}
        onClick={onSelectExistingTicketMode}
      >
        <Icon name="ticket" /> {copy.useExisting}
      </button>
    </div>
  );
}

interface ExistingTicketListProps {
  bookingLinkItems: ItineraryItem[];
  copy: TicketModalCopy;
  existingCandidates: BookingDoc[];
  selectedBookingId: string;
  onSelectExistingTicket: (booking: BookingDoc) => void;
}

export function ExistingTicketList({
  bookingLinkItems,
  copy,
  existingCandidates,
  selectedBookingId,
  onSelectExistingTicket,
}: ExistingTicketListProps) {
  return (
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
            onChange={() => onSelectExistingTicket(booking)}
          />
          <span>
            <strong>{booking.title}</strong>
            <span>{formatBookingSummary(booking, bookingLinkItems)}</span>
          </span>
        </label>
      ))}
      {!existingCandidates.length ? (
        <p className="m-0 text-xs font-bold text-(--color-text-muted)">
          {copy.noExisting}
        </p>
      ) : null}
    </div>
  );
}

interface TicketFieldGridProps {
  confirmationCode: string;
  copy: TicketModalCopy;
  endsAt: string;
  notes: string;
  providerName: string;
  startsAt: string;
  title: string;
  onConfirmationCodeChange: (value: string) => void;
  onEndsAtChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onProviderNameChange: (value: string) => void;
  onStartsAtChange: (value: string) => void;
  onTitleChange: (value: string) => void;
}

export function TicketFieldGrid({
  confirmationCode,
  copy,
  endsAt,
  notes,
  providerName,
  startsAt,
  title,
  onConfirmationCodeChange,
  onEndsAtChange,
  onNotesChange,
  onProviderNameChange,
  onStartsAtChange,
  onTitleChange,
}: TicketFieldGridProps) {
  return (
    <div className={ticketFieldGridClassName}>
      <label className={ticketFieldClassName}>
        <span>{copy.ticketTitle}</span>
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </label>
      <label className={ticketFieldClassName}>
        <span>{copy.provider}</span>
        <input
          value={providerName}
          onChange={(event) => onProviderNameChange(event.target.value)}
        />
      </label>
      <label className={ticketFieldClassName}>
        <span>{copy.confirmation}</span>
        <input
          value={confirmationCode}
          onChange={(event) => onConfirmationCodeChange(event.target.value)}
        />
      </label>
      <label className={ticketFieldClassName}>
        <span>{copy.startsAt}</span>
        <DateTimePickerField value={startsAt} onChange={onStartsAtChange} />
      </label>
      <label className={ticketFieldClassName}>
        <span>{copy.endsAt}</span>
        <DateTimePickerField value={endsAt} onChange={onEndsAtChange} />
      </label>
      <label className={cn(ticketFieldClassName, "col-span-full")}>
        <span>{copy.notes}</span>
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </label>
    </div>
  );
}

interface LinkedActivitiesPickerProps {
  bookingLinkItems: ItineraryItem[];
  copy: TicketModalCopy;
  itemId: string;
  relatedItineraryItemIds: string[];
  onRelatedItineraryItemIdsChange: (
    updater: (current: string[]) => string[],
  ) => void;
}

export function LinkedActivitiesPicker({
  bookingLinkItems,
  copy,
  itemId,
  relatedItineraryItemIds,
  onRelatedItineraryItemIdsChange,
}: LinkedActivitiesPickerProps) {
  return (
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
              disabled={candidate.id === itemId}
              onChange={() =>
                onRelatedItineraryItemIdsChange((current) =>
                  toggleId(current, candidate.id),
                )
              }
            />
            <span>
              {candidate.day} · {candidate.activity}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
