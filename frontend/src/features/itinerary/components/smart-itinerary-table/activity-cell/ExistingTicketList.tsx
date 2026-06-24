import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import { formatBookingSummary } from "@/src/features/itinerary/domain/itinerary-item-editing";
import {
  ticketExistingGridClassName,
  ticketExistingOptionClassName,
} from "../smart-itinerary-table.styles";
import type { TicketModalCopy } from "./itinerary-ticket-modal.types";

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
