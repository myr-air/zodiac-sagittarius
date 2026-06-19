import { Icon } from "@/src/ui/icons";
import type { BookingDoc } from "@/src/trip/types";
import type { ticketModalCopy } from "@/src/features/itinerary/domain/itinerary-item-editing";
import { ticketModalFooterClassName } from "../smart-itinerary-table.styles";
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
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:border-(--color-danger-border) hover:bg-(--color-danger-soft) hover:text-(--color-danger) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50"
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
          className="inline-flex min-h-9 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:bg-(--color-surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)"
          disabled={unlinking}
          onClick={onClose}
        >
          {copy.cancel}
        </button>
        <button
          type="submit"
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route) px-3 text-xs font-extrabold text-white hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50"
          disabled={saving || unlinking || !title.trim() || (mode === "existing" && !selectedBookingId)}
        >
          <Icon name="ticket" />
          {copy.save}
        </button>
      </div>
    </footer>
  );
}
