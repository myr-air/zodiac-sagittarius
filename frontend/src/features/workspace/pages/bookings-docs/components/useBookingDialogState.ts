import { useState, type FormEvent } from "react";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/src/features/itinerary/lib/itinerary-time";
import { toggleId } from "@/src/features/itinerary/lib/itinerary-item-helpers";
import type {
  BookingDoc,
  BookingDocStatus,
  BookingDocType,
  BookingDocVisibility,
  Trip,
} from "@/src/trip/types";
import type { BookingCopy } from "../BookingsDocsPage.copy";
import type { BookingDocInput } from "../BookingsDocsPage.types";

interface BookingDialogStateInput {
  booking: BookingDoc | null;
  copy: Pick<BookingCopy, "externalLinkLabel">;
  trip: Trip;
  onSubmit: (input: BookingDocInput) => void | Promise<void>;
}

export function useBookingDialogState({
  booking,
  copy,
  trip,
  onSubmit,
}: BookingDialogStateInput) {
  const [title, setTitle] = useState(booking?.title ?? "");
  const [type, setType] = useState<BookingDocType>(booking?.type ?? "flight");
  const [status, setStatus] = useState<BookingDocStatus>(
    booking?.status ?? "draft",
  );
  const [visibility, setVisibility] = useState<BookingDocVisibility>(
    booking?.visibility ?? "shared",
  );
  const [providerName, setProviderName] = useState(booking?.providerName ?? "");
  const [confirmationCode, setConfirmationCode] = useState(
    booking?.confirmationCode ?? "",
  );
  const [startsAt, setStartsAt] = useState(
    toDateTimeLocalValue(booking?.startsAt),
  );
  const [endsAt, setEndsAt] = useState(toDateTimeLocalValue(booking?.endsAt));
  const [priceAmount, setPriceAmount] = useState(
    booking?.priceAmount?.toString() ?? "",
  );
  const [currency, setCurrency] = useState(booking?.currency ?? "HKD");
  const [externalUrl, setExternalUrl] = useState(
    booking?.externalLinks[0]?.url ?? "",
  );
  const [notes, setNotes] = useState(booking?.notes ?? "");
  const [travelerIds, setTravelerIds] = useState(
    () => booking?.travelerIds ?? trip.members.slice(0, 1).map((member) => member.id),
  );
  const [relatedItineraryItemIds, setRelatedItineraryItemIds] = useState(
    () => booking?.relatedItineraryItemIds ?? [],
  );
  const [relatedTaskIds, setRelatedTaskIds] = useState(
    () => booking?.relatedTaskIds ?? [],
  );
  const [relatedExpenseIds, setRelatedExpenseIds] = useState(
    () => booking?.relatedExpenseIds ?? [],
  );
  const [noteIds, setNoteIds] = useState(() => booking?.noteIds ?? []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const linkUrl = externalUrl.trim();

    onSubmit({
      type,
      title: trimmedTitle,
      status,
      visibility,
      ownerMemberId:
        visibility === "private"
          ? travelerIds[0] || null
          : booking?.ownerMemberId ?? null,
      providerName: providerName.trim() || null,
      confirmationCode: confirmationCode.trim() || null,
      startsAt: fromDateTimeLocalValue(startsAt),
      endsAt: fromDateTimeLocalValue(endsAt),
      timezone: booking?.timezone ?? "Asia/Hong_Kong",
      priceAmount: priceAmount ? Number(priceAmount) : null,
      currency: currency.trim() || null,
      travelerIds,
      externalLinks: linkUrl
        ? [
            {
              id: booking?.externalLinks[0]?.id ?? "link-local-1",
              label: copy.externalLinkLabel,
              url: linkUrl,
              provider: providerName.trim() || null,
              accessNote: null,
            },
          ]
        : [],
      relatedItineraryItemIds,
      relatedTaskIds,
      relatedExpenseIds,
      noteIds,
      notes: notes.trim() || null,
    });
  }

  return {
    confirmationCode,
    currency,
    endsAt,
    externalUrl,
    noteIds,
    notes,
    priceAmount,
    providerName,
    relatedExpenseIds,
    relatedItineraryItemIds,
    relatedTaskIds,
    setConfirmationCode,
    setCurrency,
    setEndsAt,
    setExternalUrl,
    setNotes,
    setPriceAmount,
    setProviderName,
    setStartsAt,
    setStatus,
    setTitle,
    setType,
    setVisibility,
    startsAt,
    status,
    submit,
    title,
    toggleExpense: (expenseId: string) =>
      setRelatedExpenseIds((current) => toggleId(current, expenseId)),
    toggleItineraryItem: (itemId: string) =>
      setRelatedItineraryItemIds((current) => toggleId(current, itemId)),
    toggleNote: (noteId: string) =>
      setNoteIds((current) => toggleId(current, noteId)),
    toggleTask: (taskId: string) =>
      setRelatedTaskIds((current) => toggleId(current, taskId)),
    toggleTraveler: (memberId: string) =>
      setTravelerIds((current) => toggleId(current, memberId)),
    travelerIds,
    type,
    visibility,
  };
}
