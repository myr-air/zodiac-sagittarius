import { describe, expect, it } from "vitest";
import {
  buildImportItineraryRequest,
  buildImportedBookingDocCreateRequest,
  buildImportedExpenseCreateRequest,
  buildImportedItineraryItemCreateRequest,
  buildImportedStopNoteCreateRequest,
  buildImportedTaskCreateRequest,
  buildImportedTaskStatusPatchRequest,
} from "./itinerary-import-api-requests";
import {
  importedBookingDoc,
  importedExpense,
  importedItineraryItem,
  importedStopNote,
  importedTask,
} from "./itinerary-import-api.test-support";
import { pathIdRain } from "../testing/itinerary-path-fixtures";

describe("itinerary import API request builders", () => {
  it("builds API import requests for itinerary content", () => {
    expect(
      buildImportItineraryRequest({
        fileName: "plan.json",
        contentType: "application/json",
        content: "{\"items\":[]}",
      }),
    ).toEqual({
      fileName: "plan.json",
      contentType: "application/json",
      mode: "auto",
      content: "{\"items\":[]}",
    });
  });

  it("builds imported task and stop-note API requests", () => {
    expect(
      buildImportedTaskCreateRequest({
        clientMutationId: "task-create-mutation",
        task: importedTask,
      }),
    ).toEqual({
      clientMutationId: "task-create-mutation",
      tripPlanId: "plan-rain",
      title: "Confirm tickets",
      visibility: "shared",
      kind: "booking",
      assigneeId: "member-aom",
      relatedItemId: "item-created",
    });

    expect(
      buildImportedTaskStatusPatchRequest({
        clientMutationId: "task-status-mutation",
        createdTask: { ...importedTask, id: "task-created", version: 4 },
        status: "done",
      }),
    ).toEqual({
      clientMutationId: "task-status-mutation",
      expectedVersion: 4,
      patch: { status: "done" },
    });

    expect(
      buildImportedStopNoteCreateRequest({
        clientMutationId: "note-create-mutation",
        note: importedStopNote,
      }),
    ).toEqual({
      clientMutationId: "note-create-mutation",
      tripPlanId: "plan-rain",
      itineraryItemId: "item-created",
      body: "Use exit C",
    });
  });

  it("builds imported expense and booking-doc API requests", () => {
    expect(
      buildImportedExpenseCreateRequest({
        clientMutationId: "expense-create-mutation",
        expense: importedExpense,
      }),
    ).toEqual({
      clientMutationId: "expense-create-mutation",
      tripPlanId: "plan-rain",
      title: "Museum ticket",
      amountMinor: 1200,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: null,
      receiptUrl: null,
      lineItems: [],
      comments: [],
      paidBy: "member-aom",
      category: "tickets",
      splits: { "member-aom": 1200 },
      itineraryItemId: "item-created",
    });

    expect(
      buildImportedBookingDocCreateRequest({
        bookingDoc: importedBookingDoc,
        clientMutationId: "booking-create-mutation",
        expenseIdMap: new Map([[importedExpense.id, "expense-created"]]),
        noteIdMap: new Map([[importedStopNote.id, "note-created"]]),
        taskIdMap: new Map([[importedTask.id, "task-created"]]),
      }),
    ).toEqual({
      clientMutationId: "booking-create-mutation",
      tripPlanId: "plan-rain",
      type: "activity_ticket",
      title: "Museum booking",
      status: "confirmed",
      visibility: "shared",
      ownerMemberId: "member-aom",
      providerName: "Museum",
      confirmationCode: "ABC123",
      startsAt: null,
      endsAt: null,
      timezone: "Asia/Hong_Kong",
      priceAmount: 12,
      currency: "HKD",
      travelerIds: ["member-aom"],
      externalLinks: [],
      relatedItineraryItemIds: ["item-created"],
      relatedTaskIds: ["task-created"],
      relatedExpenseIds: ["expense-created"],
      noteIds: ["note-created"],
      notes: "Bring passports",
    });
  });

  it("builds imported itinerary item create requests with remapped parent ids", () => {
    expect(
      buildImportedItineraryItemCreateRequest({
        clientMutationId: "itinerary-import-create-mutation",
        createdItemIdsByImportId: new Map(),
        createdItemIdsByPreviewId: new Map([
          ["preview-parent", "created-parent"],
        ]),
        item: importedItineraryItem,
      }),
    ).toEqual({
      clientMutationId: "itinerary-import-create-mutation",
      planVariantId: "plan-rain",
      pathGroupId: "path-group-import",
      pathId: pathIdRain,
      pathName: "Rain plan",
      pathRole: "alternative",
      parentItemId: "created-parent",
      itemKind: "activity",
      timeMode: "scheduled",
      isPlanBlock: undefined,
      status: "planned",
      priority: "high",
      day: "2026-06-19",
      startTime: "10:00",
      endTime: "11:15",
      endOffsetDays: 0,
      activity: "Imported museum",
      activityType: "attraction",
      activitySubtype: null,
      place: "Museum",
      mapLink: "https://maps.example/museum",
      address: "100 Museum Road",
      coordinates: { lat: 22.3, lng: 114.17 },
      durationMinutes: 75,
      transportation: "MTR",
      details: { source: "import" },
      note: "Use group entrance",
    });
  });
});
