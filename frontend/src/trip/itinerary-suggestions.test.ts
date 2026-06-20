import { describe, expect, it } from "vitest";
import { seedTrip } from "./seed";
import {
  approveSuggestion,
  createLocalEditSuggestion,
  detectSuggestionConflict,
  rejectSuggestionById,
  replaceSuggestionById,
} from "./suggestions";
import type { Suggestion } from "./types";

describe("itinerary suggestions", () => {
  it("detects stale suggestion conflicts and approves fresh suggestions", () => {
    const target = seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!;
    const conflicted = detectSuggestionConflict(seedTrip.itineraryItems, {
      id: "suggestion-stale",
      tripId: seedTrip.id,
      planVariantId: seedTrip.activePlanVariantId,
      proposerId: "member-beam",
      type: "edit",
      targetItemId: target.id,
      sourceVersion: target.version - 1,
      status: "pending",
      proposedPatch: { note: "ขอเลื่อนร้านนี้หลังเช็คอิน" },
      createdAt: "2026-05-27T12:00:00.000Z",
    });

    const approved = approveSuggestion(seedTrip.itineraryItems, {
      ...conflicted,
      id: "suggestion-fresh",
      sourceVersion: target.version,
      status: "pending",
    });

    expect(conflicted.status).toBe("conflicted");
    expect(approved.status).toBe("approved");
    expect(approved.items.find((item) => item.id === target.id)?.note).toBe("ขอเลื่อนร้านนี้หลังเช็คอิน");
  });

  it("builds local edit suggestions and rejects them by id", () => {
    const target = seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!;
    const suggestion = createLocalEditSuggestion([], {
      tripId: seedTrip.id,
      proposerId: "member-beam",
      targetItem: target,
      createdAt: "2026-05-27T12:00:00.000Z",
      nextSuggestionId: (suggestions) => `suggestion-local-${suggestions.length + 1}`,
    });

    expect(suggestion).toEqual({
      id: "suggestion-local-1",
      tripId: seedTrip.id,
      proposerId: "member-beam",
      type: "edit",
      targetItemId: target.id,
      planVariantId: target.planVariantId,
      proposedPatch: { activity: target.activity },
      sourceVersion: target.version,
      status: "pending",
      createdAt: "2026-05-27T12:00:00.000Z",
    });
    expect(rejectSuggestionById([suggestion], suggestion.id)[0].status).toBe("rejected");
  });

  it("leaves add, resolved, and missing-target suggestions out of conflict handling", () => {
    const baseSuggestion = {
      id: "suggestion-add",
      tripId: seedTrip.id,
      planVariantId: seedTrip.activePlanVariantId,
      proposerId: "member-beam",
      type: "add" as const,
      targetItemId: null,
      sourceVersion: null,
      status: "pending" as const,
      proposedPatch: { activity: "Add dessert stop" },
      createdAt: "2026-05-27T12:00:00.000Z",
    };

    expect(detectSuggestionConflict(seedTrip.itineraryItems, baseSuggestion)).toBe(baseSuggestion);
    expect(approveSuggestion(seedTrip.itineraryItems, { ...baseSuggestion, type: "edit", targetItemId: null }).items).toBe(seedTrip.itineraryItems);
    expect(approveSuggestion(seedTrip.itineraryItems, { ...baseSuggestion, type: "edit", targetItemId: "missing-item" })).toMatchObject({
      status: "conflicted",
      suggestion: { status: "conflicted" },
    });
    expect(detectSuggestionConflict(seedTrip.itineraryItems, { ...baseSuggestion, status: "approved" })).toMatchObject({ status: "approved" });
  });

  it("replaces one suggestion by id without changing the rest of the queue", () => {
    expect(
      replaceSuggestionById(
        [
          { id: "suggestion-a", status: "pending" },
          { id: "suggestion-b", status: "pending" },
        ] as Suggestion[],
        "suggestion-b",
        { id: "suggestion-b", status: "approved" } as Suggestion,
      ),
    ).toEqual([
      { id: "suggestion-a", status: "pending" },
      { id: "suggestion-b", status: "approved" },
    ]);
  });
});
