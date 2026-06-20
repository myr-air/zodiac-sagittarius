import { noop } from "@/src/testing/storybook-actions";
import type { ContextRail } from "@/src/features/itinerary/components";
import { buildBookingDoc } from "@/src/features/itinerary/testing";
import { tripFixture } from "@/src/trip/trip-fixtures";

type ContextRailStoryArgs = Parameters<typeof ContextRail>[0];

export const contextRailSelectedItem =
  tripFixture.planItems.find((item) => item.id === "item-dimdim") ??
  tripFixture.planItems[0];

export const contextRailBaseArgs = {
  trip: tripFixture.trip,
  selectedItem: contextRailSelectedItem,
  suggestions: tripFixture.suggestions,
  stopNotes: tripFixture.stopNotes,
  tasks: tripFixture.tasks,
  bookingDocs: tripFixture.trip.bookingDocs ?? [],
  currentMember: tripFixture.currentMembers.owner,
  expenseSummary: tripFixture.expenseSummaries.owner,
  canEdit: true,
  canCreateNote: true,
  canCreateSuggestion: true,
  canReviewSuggestions: true,
  canEditExpenses: true,
  open: true,
  onCreateNote: noop,
  onCreateExpense: noop,
  onUpdateExpense: noop,
  onDeleteExpense: noop,
  onDeleteNote: noop,
  onEditSelected: noop,
  onReviewSuggestion: noop,
  onSuggestSelected: noop,
  onToggleTaskStatus: noop,
  onUpdateNote: noop,
  onClose: noop,
} satisfies ContextRailStoryArgs;

export const contextRailBookingDocs = [
  buildBookingDoc({
    id: "story-booking-dimdim",
    tripId: tripFixture.trip.id,
    tripPlanId: contextRailSelectedItem.planVariantId,
    type: "activity_ticket",
    title: "Dim Dim Sum reservation",
    status: "booked",
    ownerMemberId: tripFixture.currentMembers.owner.id,
    providerName: "Dim Dim Sum",
    confirmationCode: "DDS-42",
    timezone: "Asia/Hong_Kong",
    travelerIds: [tripFixture.currentMembers.owner.id],
    relatedItineraryItemIds: [contextRailSelectedItem.id],
    notes: "Window table",
    createdBy: tripFixture.currentMembers.owner.id,
  }),
];

export const readOnlyTravelerContextRailArgs = {
  ...contextRailBaseArgs,
  currentMember: tripFixture.currentMembers.traveler,
  canEdit: false,
  canCreateNote: false,
  canReviewSuggestions: false,
  tasks: [],
  stopNotes: [],
  selectedItem: { ...contextRailSelectedItem, advisories: [] },
} satisfies ContextRailStoryArgs;
