import { describe, expect, it, vi } from "vitest";
import {
  nextClientMutationId,
  nextLocalBookingDocId,
  nextLocalExpenseId,
  nextLocalItemId,
  nextLocalPhotoAlbumId,
  nextLocalPlanVariantId,
  nextLocalStopNoteId,
  nextLocalSuggestionId,
  nextLocalTaskId,
} from "@/src/trip/local-ids";
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

describe("local ids", () => {
  it("generates collision-free itinerary ids with the requested prefix", () => {
    expect(
      nextLocalItemId(
        [
          { id: "item-new-1" },
          { id: "item-new-3" },
          { id: "item-api" },
        ] as ItineraryItem[],
        "item-new",
      ),
    ).toBe("item-new-4");
  });

  it("generates collision-free local record ids", () => {
    expect(
      nextLocalPlanVariantId([
        { id: "plan-variant-local-1" },
        { id: "plan-variant-local-3" },
      ] as PlanVariant[]),
    ).toBe("plan-variant-local-4");
    expect(
      nextLocalSuggestionId([
        { id: "suggestion-local-1" },
        { id: "suggestion-local-3" },
      ] as Suggestion[]),
    ).toBe("suggestion-local-4");
    expect(
      nextLocalTaskId([
        { id: "task-local-1" },
        { id: "task-local-3" },
      ] as TripTask[]),
    ).toBe("task-local-4");
    expect(
      nextLocalStopNoteId([
        { id: "note-local-1" },
        { id: "note-local-3" },
      ] as StopNote[]),
    ).toBe("note-local-4");
    expect(
      nextLocalBookingDocId([
        { id: "booking-local-1" },
        { id: "booking-local-3" },
      ] as BookingDoc[]),
    ).toBe("booking-local-4");
    expect(
      nextLocalPhotoAlbumId([
        { id: "photo-album-local-1" },
        { id: "photo-album-local-3" },
      ] as TripPhotoAlbumLink[]),
    ).toBe("photo-album-local-4");
    expect(
      nextLocalExpenseId([
        { id: "expense-local-1" },
        { id: "expense-local-3" },
      ] as Expense[]),
    ).toBe("expense-local-4");
  });

  it("uses crypto UUIDs for client mutation ids when available", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-1" });

    expect(nextClientMutationId("task")).toBe("task-uuid-1");

    vi.unstubAllGlobals();
  });

  it("falls back to a timestamp for client mutation ids without crypto UUIDs", () => {
    vi.stubGlobal("crypto", {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T00:00:00.000Z"));

    expect(nextClientMutationId("task")).toBe(
      `task-${Date.now().toString(36)}`,
    );

    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});
