import type { BookingDocInputLike } from "./booking-doc-inputs";
import type {
  BookingDocType,
  Expense,
  ItineraryItem,
  Member,
} from "./types";

export interface ExpenseEstimateBookingContext {
  currentMemberId: string;
  defaultTimezone?: string | null;
  members: Pick<Member, "id">[];
  itineraryItems: Pick<ItineraryItem, "id">[];
  selectedTripPlanId?: string | null;
  mainTripPlanId?: string | null;
  activePlanVariantId?: string | null;
}

export function bookingTypeForExpenseEstimate(expense: Expense): BookingDocType {
  if (expense.category === "stay") return "hotel";
  if (expense.category === "tickets") return "activity_ticket";
  if (expense.category === "transport") return "public_transport";
  return "other";
}

export function bookingDocInputForExpenseEstimate(
  expense: Expense,
  context: ExpenseEstimateBookingContext,
): BookingDocInputLike {
  const sourceTripPlanId =
    expense.tripPlanId ||
    context.selectedTripPlanId ||
    context.mainTripPlanId ||
    context.activePlanVariantId;
  const linkedItem = expense.itineraryItemId
    ? context.itineraryItems.find((item) => item.id === expense.itineraryItemId)
    : null;

  return {
    tripPlanId: sourceTripPlanId,
    type: bookingTypeForExpenseEstimate(expense),
    title: `Estimate: ${expense.title}`,
    status: "draft",
    visibility: "shared",
    ownerMemberId: context.currentMemberId,
    providerName: null,
    confirmationCode: null,
    startsAt: null,
    endsAt: null,
    timezone: context.defaultTimezone ?? null,
    priceAmount: expense.amount,
    currency: expense.currency ?? "HKD",
    travelerIds: context.members.map((member) => member.id),
    externalLinks: [],
    relatedItineraryItemIds: linkedItem ? [linkedItem.id] : [],
    relatedTaskIds: [],
    relatedExpenseIds: [],
    noteIds: [],
    notes: [
      "Plan estimate copied from an Actual Expense. This does not create or move real money.",
      `Source actual expense: ${expense.title}`,
    ].join("\n"),
  };
}
