import { DateTimePickerField } from "@/src/shared/components/date-time-pickers";
import { cn } from "@/src/lib/cn";
import {
  ticketFieldClassName,
  ticketFieldGridClassName,
} from "../smart-itinerary-table.styles";
import type { TicketModalCopy } from "./itinerary-ticket-modal.types";

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
