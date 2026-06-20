import { Icon } from "@/src/ui/icons";
import {
  ticketModeButtonClassName,
  ticketModeToggleClassName,
} from "../smart-itinerary-table.styles";
import type { TicketFormMode } from "./booking-ticket-form";
import type { TicketModalCopy } from "./itinerary-ticket-modal.types";

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
