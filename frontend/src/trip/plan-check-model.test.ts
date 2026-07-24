/**
 * plan-check-model — groupFindingsByStop (M82LQRZD T2 #1) plus
 * stopFindingSummary and planPendingTotal (M82LQRZD T2 #2). The latter two
 * expose per-stop highest-severity + pending count and a plan-level pending
 * total for the rail summary line; both are scoped to plan-check pending
 * suggestions only, distinct from member suggestions and M2 sibling overlap
 * cues.
 */
import { describe, expect, it } from "vitest";
import type {
  PlanCheckSummary,
  PlanSuggestionSummary,
} from "./plan-check-api";
import {
  groupFindingsByStop,
  planPendingTotal,
  stopFindingSummary,
} from "./plan-check-model";

const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const CHECK_ID = "018f4e90-0000-7000-8000-0000000000aa";
const ITEM_1 = "018f4e83-4000-7d00-c222-000000000001";
const ITEM_2 = "018f4e83-4000-7d00-c222-000000000002";
const ITEM_3 = "018f4e83-4000-7d00-c222-000000000003";

function makeSuggestion(
  overrides: Partial<PlanSuggestionSummary> & { id: string },
): PlanSuggestionSummary {
  return {
    tripId: TRIP_ID,
    planCheckId: CHECK_ID,
    severity: "warning",
    scope: "item",
    targetItemIds: [],
    explanation: { en: "", th: "" },
    recommendedAction: { en: "", th: "" },
    actionKind: null,
    actionPayload: null,
    status: "pending",
    snoozedUntil: null,
    createdAt: "2026-07-23T10:00:05Z",
    updatedAt: "2026-07-23T10:00:05Z",
    version: 1,
    ...overrides,
  };
}

function makeSummary(suggestions: PlanSuggestionSummary[]): PlanCheckSummary {
  return {
    id: CHECK_ID,
    tripId: TRIP_ID,
    tripPlanId: null,
    createdBy: "018f4e80-1111-7000-9000-000000000001",
    itineraryFingerprint: "sha256:abc123",
    stale: false,
    status: "completed",
    languageMetadata: null,
    createdAt: "2026-07-23T10:00:00Z",
    completedAt: "2026-07-23T10:00:05Z",
    version: 1,
    suggestions,
  };
}

describe("plan-check-model groupFindingsByStop", () => {
  it("groups only status=pending suggestions by targetItemId, placing multi-target (betweenItems) findings under every targetItemId and excluding accepted/dismissed/snoozed", () => {
    const pendingSingle = makeSuggestion({
      id: "sugg-pending-single",
      scope: "item",
      targetItemIds: [ITEM_1],
      status: "pending",
    });
    const pendingBetweenItems = makeSuggestion({
      id: "sugg-pending-between",
      scope: "betweenItems",
      targetItemIds: [ITEM_1, ITEM_2],
      status: "pending",
    });
    const accepted = makeSuggestion({
      id: "sugg-accepted",
      scope: "item",
      targetItemIds: [ITEM_1],
      status: "accepted",
    });
    const dismissed = makeSuggestion({
      id: "sugg-dismissed",
      scope: "item",
      targetItemIds: [ITEM_2],
      status: "dismissed",
    });
    const snoozed = makeSuggestion({
      id: "sugg-snoozed",
      scope: "item",
      targetItemIds: [ITEM_3],
      status: "snoozed",
    });

    const summary = makeSummary([
      pendingSingle,
      pendingBetweenItems,
      accepted,
      dismissed,
      snoozed,
    ]);

    const groups = groupFindingsByStop(summary);

    expect(groups[ITEM_1]?.map((f) => f.id)).toEqual([
      "sugg-pending-single",
      "sugg-pending-between",
    ]);
    expect(groups[ITEM_2]?.map((f) => f.id)).toEqual(["sugg-pending-between"]);
    expect(groups[ITEM_3]).toBeUndefined();
  });
});

describe("plan-check-model stopFindingSummary", () => {
  it("returns the highest severity among pending findings at a stop and their count, ignoring non-pending suggestions and other stops", () => {
    const pendingInfo = makeSuggestion({
      id: "sugg-pending-info",
      scope: "item",
      targetItemIds: [ITEM_1],
      severity: "info",
      status: "pending",
    });
    const pendingError = makeSuggestion({
      id: "sugg-pending-error",
      scope: "item",
      targetItemIds: [ITEM_1],
      severity: "error",
      status: "pending",
    });
    const acceptedCritical = makeSuggestion({
      id: "sugg-accepted-critical",
      scope: "item",
      targetItemIds: [ITEM_1],
      severity: "critical",
      status: "accepted",
    });
    const otherStopWarning = makeSuggestion({
      id: "sugg-other-stop-warning",
      scope: "item",
      targetItemIds: [ITEM_2],
      severity: "warning",
      status: "pending",
    });

    const summary = makeSummary([
      pendingInfo,
      pendingError,
      acceptedCritical,
      otherStopWarning,
    ]);
    const groups = groupFindingsByStop(summary);

    expect(stopFindingSummary(groups, ITEM_1)).toEqual({
      severity: "error",
      count: 2,
    });
    expect(stopFindingSummary(groups, ITEM_2)).toEqual({
      severity: "warning",
      count: 1,
    });
  });

  it("returns undefined for a stop with no pending findings", () => {
    const summary = makeSummary([]);
    const groups = groupFindingsByStop(summary);

    expect(stopFindingSummary(groups, ITEM_3)).toBeUndefined();
  });
});

describe("plan-check-model planPendingTotal", () => {
  it("counts each pending suggestion once at the plan level, even when a betweenItems finding targets multiple stops, and excludes non-pending suggestions", () => {
    const pendingSingle = makeSuggestion({
      id: "sugg-pending-single",
      scope: "item",
      targetItemIds: [ITEM_1],
      status: "pending",
    });
    const pendingBetweenItems = makeSuggestion({
      id: "sugg-pending-between",
      scope: "betweenItems",
      targetItemIds: [ITEM_1, ITEM_2],
      status: "pending",
    });
    const accepted = makeSuggestion({
      id: "sugg-accepted",
      scope: "item",
      targetItemIds: [ITEM_2],
      status: "accepted",
    });
    const dismissed = makeSuggestion({
      id: "sugg-dismissed",
      scope: "item",
      targetItemIds: [ITEM_3],
      status: "dismissed",
    });

    const summary = makeSummary([
      pendingSingle,
      pendingBetweenItems,
      accepted,
      dismissed,
    ]);

    expect(planPendingTotal(summary)).toBe(2);
  });

  it("returns zero for a plan check with no pending suggestions", () => {
    const summary = makeSummary([]);

    expect(planPendingTotal(summary)).toBe(0);
  });
});
