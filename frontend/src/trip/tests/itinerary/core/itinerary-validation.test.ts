import { describe, expect, it } from "vitest";
import { buildTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  buildOverlapWarnings,
  getTimeWindowInterval,
  validateHierarchyFields,
  validateItemFields,
} from "../../../itinerary-core";

describe("itinerary validation", () => {
  const base = buildTripFixtureItineraryItem();

  it("identifies overlap warnings by sibling scope", () => {
    const first = {
      ...base,
      id: "validation-overlap-1",
      startTime: "09:00",
      durationMinutes: 120,
      endTime: null,
      endOffsetDays: 0,
      timeMode: "scheduled" as const,
      parentItemId: null,
    };
    const second = {
      ...base,
      id: "validation-overlap-2",
      startTime: "10:00",
      durationMinutes: 30,
      endTime: null,
      endOffsetDays: 0,
      timeMode: "scheduled" as const,
      parentItemId: null,
    };
    const parentOnly = {
      ...base,
      id: "validation-no-overlap",
      startTime: "12:00",
      durationMinutes: 30,
      endTime: null,
      endOffsetDays: 0,
      timeMode: "scheduled" as const,
      parentItemId: "unrelated-parent",
    };

    const warnings = buildOverlapWarnings([first, second, parentOnly]);
    const overlapIds = Array.from(warnings.keys()).sort();
    expect(overlapIds).toEqual(["validation-overlap-1", "validation-overlap-2"]);
  });

  it("keeps overlap checks null for invalid or flexible windows", () => {
    const flexible = {
      ...base,
      id: "validation-flex",
      startTime: "09:00",
      durationMinutes: 60,
      endTime: null,
      endOffsetDays: 0,
      timeMode: "flexible" as const,
    };
    const invalidTime = {
      ...base,
      id: "validation-invalid",
      startTime: "25:00",
      durationMinutes: 60,
      endTime: null,
      endOffsetDays: 0,
      timeMode: "scheduled" as const,
    };

    expect(getTimeWindowInterval(flexible)).toBeNull();
    expect(getTimeWindowInterval(invalidTime)).toBeNull();
  });

  it("validates required fields on each item", () => {
    const item = {
      ...base,
      id: "validation-item",
      startTime: "",
      endTime: null,
      durationMinutes: null,
      mapLink: "",
      transportation: "",
      timeMode: "scheduled" as const,
    };
    expect(validateItemFields(item).map((warning) => warning.code)).toEqual(
      expect.arrayContaining(["missing-start-time", "missing-duration", "missing-map-link", "missing-transportation"]),
    );
  });

  it("warns when child is not inside parent window", () => {
    const parent = {
      ...base,
      id: "validation-parent",
      day: "2026-06-17",
      startTime: "09:00",
      durationMinutes: 30,
      endTime: null,
      endOffsetDays: 0,
      isPlanBlock: true,
      parentItemId: null,
      timeMode: "scheduled" as const,
    };
    const child = {
      ...base,
      id: "validation-child",
      day: "2026-06-17",
      startTime: "10:00",
      durationMinutes: 120,
      endTime: null,
      endOffsetDays: 0,
      parentItemId: "validation-parent",
      timeMode: "scheduled" as const,
    };

    const warnings = validateHierarchyFields(child, [parent, child]);
    expect(warnings.map((warning) => warning.code)).toContain("child-outside-plan-block");
  });
});
