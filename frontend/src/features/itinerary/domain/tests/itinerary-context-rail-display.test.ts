import { describe, expect, it } from "vitest";

import type { BookingDocType, Member, Suggestion, TripTask } from "@/src/trip/types";
import { buildTripFixtureSuggestion } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  bookingDocTypeOptions,
  memberDisplayName,
  suggestionLabel,
  taskKindLabel,
} from "../itinerary-context-rail-display";

describe("itinerary context rail display helpers", () => {
  it("lists all booking doc type options", () => {
    expect(bookingDocTypeOptions).toEqual<BookingDocType[]>([
      "flight",
      "train",
      "public_transport",
      "hotel",
      "insurance",
      "passport",
      "visa",
      "activity_ticket",
      "other",
    ]);
  });

  it("resolves display name from member", () => {
    const member: Member = {
      id: "m1",
      displayName: "Explorer Friend",
      role: "traveler",
      presence: "online",
      color: "#0f172a",
    };
    expect(memberDisplayName(member, "Unknown")).toBe("Explorer Friend");
    expect(memberDisplayName(undefined, "Unknown")).toBe("Unknown");
  });

  it("builds suggestion labels from proposed patch", () => {
    const suggestion: Suggestion = buildTripFixtureSuggestion({
      id: "s-1",
      proposerId: "m1",
      targetItemId: "item-1",
      planVariantId: "main",
      proposedPatch: {
        transportation: "Flight",
      },
      sourceVersion: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(suggestionLabel(suggestion, "Fallback")).toBe("Flight");
    expect(
      suggestionLabel(
        {
          ...suggestion,
          proposedPatch: {
            note: "Add note",
          },
        },
        "Fallback",
      ),
    ).toBe("Add note");
    expect(
      suggestionLabel(
        {
          ...suggestion,
          proposedPatch: {},
        },
        "Fallback",
      ),
    ).toBe("Fallback");
  });

  it("reuses booking task label logic from domain helper", () => {
    const bookingTask: TripTask = {
      id: "task-1",
      relatedItemId: null,
      title: "Booking confirmation",
      status: "open",
      kind: "booking",
      createdBy: "m1",
      assigneeId: null,
      visibility: "shared",
      tripPlanId: "main",
      version: 1,
    };

    expect(taskKindLabel(bookingTask, { booking: "Booking", prep: "Prep" })).toBe(
      "Booking",
    );
    expect(
      taskKindLabel(
        {
          ...bookingTask,
          kind: "prep",
          title: "จองที่พัก",
        },
        { booking: "Booking", prep: "Prep" },
      ),
    ).toBe("Booking");
    expect(
      taskKindLabel(
        { ...bookingTask, kind: "prep", title: "Review budget" },
        { booking: "Booking", prep: "Prep" },
      ),
    ).toBe("Prep");
  });
});
