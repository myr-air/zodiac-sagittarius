import type {
  BookingDoc,
  Expense,
  ExpenseComment,
  ExpenseLineItem,
  ItineraryItem,
  PlanVariant,
  StopNote,
  Suggestion,
  TripPhotoAlbumLink,
  TripTask,
} from "@/src/trip/types";

function nextLocalId<T extends Pick<{ id: string }, "id">>(
  records: T[],
  prefix: string,
): string {
  const existingIds = new Set(records.map((record) => record.id));
  let index =
    records.filter((record) => record.id.startsWith(`${prefix}-`)).length + 1;
  let id = `${prefix}-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `${prefix}-${index}`;
  }

  return id;
}

export function nextLocalItemId(
  items: ItineraryItem[],
  prefix: string,
): string {
  return nextLocalId(items, prefix);
}

export function nextLocalPlanVariantId(planVariants: PlanVariant[]): string {
  return nextLocalId(planVariants, "plan-variant-local");
}

export function nextLocalSuggestionId(suggestions: Suggestion[]): string {
  return nextLocalId(suggestions, "suggestion-local");
}

export function nextLocalTaskId(tasks: TripTask[]): string {
  return nextLocalId(tasks, "task-local");
}

export function nextLocalStopNoteId(notes: StopNote[]): string {
  return nextLocalId(notes, "note-local");
}

export function nextLocalBookingDocId(bookingDocs: BookingDoc[]): string {
  return nextLocalId(bookingDocs, "booking-local");
}

export function nextLocalPhotoAlbumId(
  photoAlbumLinks: TripPhotoAlbumLink[],
): string {
  return nextLocalId(photoAlbumLinks, "photo-album-local");
}

export function nextLocalExpenseId(expenses: Expense[]): string {
  return nextLocalId(expenses, "expense-local");
}

export function nextLocalExpenseLineItemId(
  lineItems: Array<Pick<ExpenseLineItem, "id">>,
): string {
  return nextLocalId(lineItems, "line-local");
}

export function nextLocalExpenseCommentId(
  comments: Array<Pick<ExpenseComment, "id">>,
): string {
  return nextLocalId(comments, "comment-local");
}

export function nextClientMutationId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}`;
}
