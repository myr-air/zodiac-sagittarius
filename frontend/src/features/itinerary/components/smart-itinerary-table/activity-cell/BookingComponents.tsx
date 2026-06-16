import { type FormEvent, useState } from "react";
import { createPortal } from "react-dom";

import { DateTimePickerField } from "@/src/components/DateTimePickers";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";

import {
  bookingDocTypeForItemTemplate,
  bookingIconForItem,
  bookingTemplateForItem,
  bookingTemplateLabel,
  bookingTitleForItem,
  formatBookingSummary,
  fromDateTimeLocalValue,
  itineraryDateTimeValue,
  readItineraryDetailString,
  ticketModalCopy,
  ticketNotesForItem,
  toDateTimeLocalValue,
  toggleId,
  uniqueIds,
} from "@/src/features/itinerary/domain/itinerary-item-editing";
import {
  activityBookingButtonClassName,
  activityBookingButtonEmptyClassName,
  activityBookingButtonLinkedClassName,
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
} from "../../smart-itinerary-table.styles";
import { useEscapeToClose } from "./use-escape-close";

export function ItineraryBookingButton({
  bookingDocs,
  bookingLinkItems,
  item,
  itineraryLabels,
  locale,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
}: {
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onAddBookingForItem?: (
    itemId: string,
    template?: ItineraryBookingTemplate,
  ) => string | void | Promise<string | void>;
  onSaveBookingForItem?: (
    input: ItineraryBookingTicketInput,
  ) => string | void | Promise<string | void>;
  onUnlinkBookingForItem?: (
    bookingDocId: string,
    itemId: string,
  ) => void | Promise<void>;
}) {
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  if (!onAddBookingForItem && !onSaveBookingForItem) return null;
  const icon = bookingIconForItem(item);
  const linkedBooking = bookingDocs.find((booking) =>
    booking.relatedItineraryItemIds.includes(item.id),
  );
  const label = itineraryLabels.row.createBookingDraft({
    activity: item.activity,
    template: bookingTemplateLabel(item, locale),
  });
  return (
    <>
      <button
        type="button"
        className={cn(
          activityBookingButtonClassName,
          linkedBooking
            ? activityBookingButtonLinkedClassName
            : activityBookingButtonEmptyClassName,
        )}
        aria-label={label}
        title={label}
        onClick={(event) => {
          event.stopPropagation();
          if (onSaveBookingForItem) {
            setTicketModalOpen(true);
            return;
          }
          void onAddBookingForItem?.(item.id, bookingTemplateForItem(item));
        }}
      >
        <Icon name={icon} />
        <span className="min-w-0 truncate">{bookingTemplateLabel(item, locale)}</span>
      </button>
      {ticketModalOpen && onSaveBookingForItem ? (
        <ItineraryTicketModal
          bookingDocs={bookingDocs}
          bookingLinkItems={bookingLinkItems}
          item={item}
          locale={locale}
          onClose={() => setTicketModalOpen(false)}
          onUnlink={
            onUnlinkBookingForItem
              ? async (bookingDocId) => {
                  await onUnlinkBookingForItem(bookingDocId, item.id);
                  setTicketModalOpen(false);
                }
              : undefined
          }
          onSave={async (input) => {
            await onSaveBookingForItem(input);
            setTicketModalOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

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
  const existingCandidates = bookingDocs.filter(
    (booking) =>
      booking.relatedItineraryItemIds.includes(item.id) ||
      booking.type === type ||
      (type === "public_transport" &&
        ["flight", "train", "public_transport"].includes(booking.type)),
  );
  const initiallyLinked =
    existingCandidates.find((booking) =>
      booking.relatedItineraryItemIds.includes(item.id),
    ) ?? null;
  const currentLinkedBooking =
    bookingDocs.find((booking) =>
      booking.relatedItineraryItemIds.includes(item.id),
    ) ?? null;
  const defaultTitle = bookingTitleForItem(item, type);
  const [mode, setMode] = useState<"existing" | "new">(
    initiallyLinked ? "existing" : "new",
  );
  const [selectedBookingId, setSelectedBookingId] = useState(
    initiallyLinked?.id ?? existingCandidates[0]?.id ?? "",
  );
  const selectedBooking =
    existingCandidates.find((booking) => booking.id === selectedBookingId) ??
    null;
  const initialTicket = mode === "existing" ? selectedBooking : null;
  const [title, setTitle] = useState(initialTicket?.title ?? defaultTitle);
  const [providerName, setProviderName] = useState(
    initialTicket?.providerName ??
      readItineraryDetailString(item.details, "provider") ??
      "",
  );
  const [confirmationCode, setConfirmationCode] = useState(
    initialTicket?.confirmationCode ??
      readItineraryDetailString(item.details, "bookingRef") ??
      readItineraryDetailString(item.details, "ticketRef") ??
      "",
  );
  const [startsAt, setStartsAt] = useState(
    toDateTimeLocalValue(initialTicket?.startsAt ?? itineraryDateTimeValue(item.day, item.startTime)),
  );
  const [endsAt, setEndsAt] = useState(
    toDateTimeLocalValue(initialTicket?.endsAt ?? itineraryDateTimeValue(item.day, item.endTime ?? "")),
  );
  const [notes, setNotes] = useState(
    initialTicket?.notes ?? ticketNotesForItem(item, locale),
  );
  const [relatedItineraryItemIds, setRelatedItineraryItemIds] = useState(() =>
    uniqueIds([...(initialTicket?.relatedItineraryItemIds ?? []), item.id]),
  );
  const [saving, setSaving] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const copy = ticketModalCopy(locale);

  useEscapeToClose(onClose);

  function hydrateTicketFields(booking: BookingDoc | null) {
    setTitle(booking?.title ?? defaultTitle);
    setProviderName(
      booking?.providerName ??
        readItineraryDetailString(item.details, "provider") ??
        "",
    );
    setConfirmationCode(
      booking?.confirmationCode ??
        readItineraryDetailString(item.details, "bookingRef") ??
        readItineraryDetailString(item.details, "ticketRef") ??
        "",
    );
    setStartsAt(toDateTimeLocalValue(booking?.startsAt ?? itineraryDateTimeValue(item.day, item.startTime)));
    setEndsAt(toDateTimeLocalValue(booking?.endsAt ?? itineraryDateTimeValue(item.day, item.endTime ?? "")));
    setNotes(booking?.notes ?? ticketNotesForItem(item, locale));
    setRelatedItineraryItemIds(uniqueIds([...(booking?.relatedItineraryItemIds ?? []), item.id]));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (saving || unlinking || !trimmedTitle) return;
    setSaving(true);
    try {
      await onSave({
        bookingDocId: mode === "existing" ? selectedBookingId : null,
        itemId: item.id,
        template,
        type: selectedBooking?.type ?? type,
        title: trimmedTitle,
        status: selectedBooking?.status ?? "draft",
        visibility: selectedBooking?.visibility ?? "shared",
        providerName: providerName.trim() || null,
        confirmationCode: confirmationCode.trim() || null,
        startsAt: fromDateTimeLocalValue(startsAt),
        endsAt: fromDateTimeLocalValue(endsAt),
        travelerIds: selectedBooking?.travelerIds ?? [],
        relatedItineraryItemIds: uniqueIds([...relatedItineraryItemIds, item.id]),
        notes: notes.trim() || null,
      });
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
            <div className={ticketExistingGridClassName} role="radiogroup" aria-label={copy.existingTickets}>
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
