import { Icon } from "@/src/ui/icons";
import type { BookingDoc } from "@/src/trip/types";
import type { ticketModalCopy } from "@/src/features/itinerary/domain/itinerary-item-editing";
import {
  ticketModalCancelButtonClassName,
  ticketModalFooterClassName,
  ticketModalSaveButtonClassName,
  ticketModalUnlinkButtonClassName,
} from "../smart-itinerary-table.styles";
import type { TicketFormMode } from "./booking-ticket-form";

interface ItineraryTicketModalFooterProps {
  copy: ReturnType<typeof ticketModalCopy>;
  currentLinkedBooking: BookingDoc | null;
  mode: TicketFormMode;
  onClose: () => void;
  onUnlink?: () => void;
  saving: boolean;
  selectedBookingId: string;
  title: string;
  unlinking: boolean;
}

export function ItineraryTicketModalFooter({
  copy,
  currentLinkedBooking,
  mode,
  onClose,
  onUnlink,
  saving,
  selectedBookingId,
  title,
  unlinking,
}: ItineraryTicketModalFooterProps) {
  return (
    <footer className={ticketModalFooterClassName}>
      <div className="mr-auto min-w-0">
        {currentLinkedBooking && onUnlink ? (
          <button
            type="button"
            className={ticketModalUnlinkButtonClassName}
            disabled={saving || unlinking}
            onClick={onUnlink}
          >
            <Icon name="x" />
            {unlinking ? copy.unlinking : copy.unlink}
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className={ticketModalCancelButtonClassName}
          disabled={unlinking}
          onClick={onClose}
        >
          {copy.cancel}
        </button>
        <button
          type="submit"
          className={ticketModalSaveButtonClassName}
          disabled={saving || unlinking || !title.trim() || (mode === "existing" && !selectedBookingId)}
        >
          <Icon name="ticket" />
          {copy.save}
        </button>
      </div>
    </footer>
  );
}
