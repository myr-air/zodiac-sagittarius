import { type FormEvent, useState } from "react";
import { createPortal } from "react-dom";

import { DateTimePickerField } from "@/src/shared/components/date-time-pickers";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { Locale } from "@/src/i18n/types";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import type { ItineraryBookingTicketInput } from "@/src/trip/booking-docs";

import {
  bookingDocTypeForItemTemplate,
  bookingTemplateForItem,
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
  ticketModalFooterClassName,
  ticketModalHeaderClassName,
  ticketModalTitleClassName,
  ticketModeButtonClassName,
  ticketModeToggleClassName,
} from "../smart-itinerary-table.styles";
import { useEscapeToClose } from "./use-escape-close";
import {
  buildTicketFormValues,
  buildTicketSubmitInput,
  findLinkedTicket,
  findTicketCandidates,
  type TicketFormMode,
} from "./booking-ticket-form";

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
  const template = bookingTemplateForItem(item);
  const type = bookingDocTypeForItemTemplate(item, template);
  const existingCandidates = findTicketCandidates(bookingDocs, item, type);
  const initiallyLinked = findLinkedTicket(existingCandidates, item.id);
  const currentLinkedBooking = findLinkedTicket(bookingDocs, item.id);
  const [mode, setMode] = useState<TicketFormMode>(
    initiallyLinked ? "existing" : "new",
  );
  const [selectedBookingId, setSelectedBookingId] = useState(
    initiallyLinked?.id ?? existingCandidates[0]?.id ?? "",
  );
  const selectedBooking =
    existingCandidates.find((booking) => booking.id === selectedBookingId) ??
    null;
  const initialValues = buildTicketFormValues({
    booking: mode === "existing" ? selectedBooking : null,
    item,
    locale,
    type,
  });
  const [title, setTitle] = useState(initialValues.title);
  const [providerName, setProviderName] = useState(initialValues.providerName);
  const [confirmationCode, setConfirmationCode] = useState(
    initialValues.confirmationCode,
  );
  const [startsAt, setStartsAt] = useState(initialValues.startsAt);
  const [endsAt, setEndsAt] = useState(initialValues.endsAt);
  const [notes, setNotes] = useState(initialValues.notes);
  const [relatedItineraryItemIds, setRelatedItineraryItemIds] = useState(
    initialValues.relatedItineraryItemIds,
  );
  const [saving, setSaving] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const copy = ticketModalCopy(locale);

  useEscapeToClose(onClose);

  function hydrateTicketFields(booking: BookingDoc | null) {
    const nextValues = buildTicketFormValues({ booking, item, locale, type });
    setTitle(nextValues.title);
    setProviderName(nextValues.providerName);
    setConfirmationCode(nextValues.confirmationCode);
    setStartsAt(nextValues.startsAt);
    setEndsAt(nextValues.endsAt);
    setNotes(nextValues.notes);
    setRelatedItineraryItemIds(nextValues.relatedItineraryItemIds);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (saving || unlinking || !trimmedTitle) return;
    setSaving(true);
    try {
      await onSave(
        buildTicketSubmitInput({
          item,
          mode,
          selectedBooking,
          selectedBookingId,
          template,
          type,
          values: {
            title: trimmedTitle,
            providerName,
            confirmationCode,
            startsAt,
            endsAt,
            notes,
            relatedItineraryItemIds,
          },
        }),
      );
    } finally {
      setSaving(false);
    }
  }

  async function unlinkCurrentBooking() {
    if (!currentLinkedBooking || !onUnlink || saving || unlinking) return;
    setUnlinking(true);
    try {
      await onUnlink(currentLinkedBooking.id);
    } finally {
      setUnlinking(false);
    }
  }

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
              onClick={() => {
                setMode("new");
                hydrateTicketFields(null);
              }}
            >
              <Icon name="plus" /> {copy.newTicket}
            </button>
            <button
              type="button"
              className={ticketModeButtonClassName}
              aria-pressed={mode === "existing"}
              disabled={!existingCandidates.length}
              onClick={() => {
                const booking = selectedBooking ?? existingCandidates[0] ?? null;
                setMode("existing");
                setSelectedBookingId(booking?.id ?? "");
                hydrateTicketFields(booking);
              }}
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
                    onChange={() => {
                      setSelectedBookingId(booking.id);
                      hydrateTicketFields(booking);
                    }}
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
        <footer className={ticketModalFooterClassName}>
          <div className="mr-auto min-w-0">
            {currentLinkedBooking && onUnlink ? (
              <button
                type="button"
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:border-(--color-danger-border) hover:bg-(--color-danger-soft) hover:text-(--color-danger) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving || unlinking}
                onClick={() => void unlinkCurrentBooking()}
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
      </form>
    </div>,
    document.body,
  );
}
