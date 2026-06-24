import type { Trip } from "@/src/trip/types";
import { tripWithPlans } from "./sagittarius-app-plan-fixtures";

export function tripWithPlansAndPlanScopedRecords(
  selectedPlanId = "plan-variant-backup",
): Trip {
  const draftTrip = tripWithPlans();
  const backupItem = draftTrip.itineraryItems.find(
    (item) => item.id === "item-rain-gallery",
  )!;
  const mainItem = draftTrip.itineraryItems.find(
    (item) => item.id === "item-dimdim",
  )!;

  return {
    ...draftTrip,
    activePlanVariantId: selectedPlanId,
    mainTripPlanId: selectedPlanId,
    planVariants: draftTrip.planVariants.map((plan) =>
      plan.id === selectedPlanId
        ? { ...plan, kind: "main", status: "main" }
        : { ...plan, kind: "backup", status: "backup" },
    ),
    tripPlans: draftTrip.tripPlans?.map((plan) =>
      plan.id === selectedPlanId
        ? { ...plan, kind: "main", status: "main" }
        : { ...plan, kind: "backup", status: "backup" },
    ),
    expenses: [
      {
        id: "expense-main-dimsum",
        tripId: draftTrip.id,
        tripPlanId: mainItem.planVariantId,
        title: "Main plan dim sum receipt",
        amount: 512,
        paidBy: "member-aom",
        splits: { "member-aom": 512 },
        category: "food",
        itineraryItemId: mainItem.id,
      },
      {
        id: "expense-backup-gallery",
        tripId: draftTrip.id,
        tripPlanId: backupItem.planVariantId,
        title: "Backup gallery tickets",
        amount: 240,
        paidBy: "member-aom",
        splits: { "member-aom": 240 },
        category: "tickets",
        itineraryItemId: backupItem.id,
      },
    ],
    bookingDocs: [
      {
        id: "booking-main-dimsum",
        tripId: draftTrip.id,
        tripPlanId: mainItem.planVariantId,
        type: "activity_ticket",
        title: "Main plan brunch booking",
        status: "booked",
        visibility: "shared",
        ownerMemberId: "member-aom",
        providerName: "Dim Dim Sum",
        confirmationCode: "MAIN-BRUNCH",
        startsAt: null,
        endsAt: null,
        timezone: "Asia/Hong_Kong",
        priceAmount: 512,
        currency: "HKD",
        travelerIds: ["member-aom"],
        externalLinks: [],
        relatedItineraryItemIds: [mainItem.id],
        relatedTaskIds: [],
        relatedExpenseIds: ["expense-main-dimsum"],
        noteIds: [],
        notes: null,
        createdBy: "member-aom",
        updatedAt: "2026-06-01T00:00:00.000Z",
        version: 1,
      },
      {
        id: "booking-backup-gallery",
        tripId: draftTrip.id,
        tripPlanId: backupItem.planVariantId,
        type: "activity_ticket",
        title: "Backup gallery ticket booking",
        status: "booked",
        visibility: "shared",
        ownerMemberId: "member-aom",
        providerName: "M+ Museum",
        confirmationCode: "RAIN-GALLERY",
        startsAt: null,
        endsAt: null,
        timezone: "Asia/Hong_Kong",
        priceAmount: 240,
        currency: "HKD",
        travelerIds: ["member-aom"],
        externalLinks: [],
        relatedItineraryItemIds: [backupItem.id],
        relatedTaskIds: [],
        relatedExpenseIds: ["expense-backup-gallery"],
        noteIds: [],
        notes: null,
        createdBy: "member-aom",
        updatedAt: "2026-06-01T00:00:00.000Z",
        version: 1,
      },
    ],
    tasks: [
      {
        id: "task-main-dimsum",
        tripPlanId: mainItem.planVariantId,
        title: "Main plan brunch task",
        status: "open",
        visibility: "shared",
        kind: "booking",
        createdBy: "member-aom",
        relatedItemId: mainItem.id,
      },
      {
        id: "task-backup-gallery",
        tripPlanId: backupItem.planVariantId,
        title: "Backup gallery task",
        status: "open",
        visibility: "shared",
        kind: "booking",
        createdBy: "member-aom",
        relatedItemId: backupItem.id,
      },
    ],
  };
}
