import type {
  BookingDoc,
  Expense,
  ItineraryItem,
  PlanVariant,
  StopNote,
  Suggestion,
  TripPhotoAlbumLink,
  TripTask,
} from "@/src/trip/types";

export function nextLocalItemId(
  items: ItineraryItem[],
  prefix: string,
): string {
  const existingIds = new Set(items.map((item) => item.id));
  let index =
    items.filter((item) => item.id.startsWith(`${prefix}-`)).length + 1;
  let id = `${prefix}-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `${prefix}-${index}`;
  }

  return id;
}

export function nextLocalPlanVariantId(planVariants: PlanVariant[]): string {
  const existingIds = new Set(planVariants.map((variant) => variant.id));
  let index =
    planVariants.filter((variant) =>
      variant.id.startsWith("plan-variant-local-"),
    ).length + 1;
  let id = `plan-variant-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `plan-variant-local-${index}`;
  }

  return id;
}

export function nextLocalSuggestionId(suggestions: Suggestion[]): string {
  const existingIds = new Set(suggestions.map((suggestion) => suggestion.id));
  let index =
    suggestions.filter((suggestion) =>
      suggestion.id.startsWith("suggestion-local-"),
    ).length + 1;
  let id = `suggestion-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `suggestion-local-${index}`;
  }

  return id;
}

export function nextLocalTaskId(tasks: TripTask[]): string {
  const existingIds = new Set(tasks.map((task) => task.id));
  let index =
    tasks.filter((task) => task.id.startsWith("task-local-")).length + 1;
  let id = `task-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `task-local-${index}`;
  }

  return id;
}

export function nextLocalStopNoteId(notes: StopNote[]): string {
  const existingIds = new Set(notes.map((note) => note.id));
  let index =
    notes.filter((note) => note.id.startsWith("note-local-")).length + 1;
  let id = `note-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `note-local-${index}`;
  }

  return id;
}

export function nextLocalBookingDocId(bookingDocs: BookingDoc[]): string {
  const existingIds = new Set(bookingDocs.map((bookingDoc) => bookingDoc.id));
  let index =
    bookingDocs.filter((bookingDoc) =>
      bookingDoc.id.startsWith("booking-local-"),
    ).length + 1;
  let id = `booking-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `booking-local-${index}`;
  }

  return id;
}

export function nextLocalPhotoAlbumId(
  photoAlbumLinks: TripPhotoAlbumLink[],
): string {
  const existingIds = new Set(photoAlbumLinks.map((album) => album.id));
  let index =
    photoAlbumLinks.filter((album) =>
      album.id.startsWith("photo-album-local-"),
    ).length + 1;
  let id = `photo-album-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `photo-album-local-${index}`;
  }

  return id;
}

export function nextLocalExpenseId(expenses: Expense[]): string {
  const existingIds = new Set(expenses.map((expense) => expense.id));
  let index =
    expenses.filter((expense) => expense.id.startsWith("expense-local-"))
      .length + 1;
  let id = `expense-local-${index}`;
  while (existingIds.has(id)) {
    index += 1;
    id = `expense-local-${index}`;
  }
  return id;
}

export function nextClientMutationId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}`;
}
