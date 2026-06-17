import { describe, expect, it } from "vitest";

import {
  buildStructuredStopDetails,
  detailTypeFromItem,
  durationBetweenTimes,
  endOffsetDaysBetweenTimes,
  parseRouteActivity,
  resolveStopActivityType,
  stopDialogFieldIds,
  stopDialogDetailTypeOptions,
  stopDialogDetailTypeToActivityType,
  structuredStopDetailValues,
} from "./stop-dialog.utils";
import { tripFixture } from "@/src/trip/trip-fixtures";

describe("stop dialog utils", () => {
  it("supports shared detail type options", () => {
    expect(stopDialogDetailTypeOptions).toEqual(["transportation", "stay", "experience", "task"]);
    expect(stopDialogFieldIds.activity).toBe("stop-activity");
  });

  it("maps stop detail types to activity types", () => {
    expect(stopDialogDetailTypeToActivityType.transportation).toBe("travel");
    expect(stopDialogDetailTypeToActivityType.stay).toBe("stay");
    expect(stopDialogDetailTypeToActivityType.task).toBe("experience");
    expect(stopDialogDetailTypeToActivityType.experience).toBe("experience");
  });

  it("resolves detail type from current item activity kind", () => {
    expect(
      detailTypeFromItem({
        ...tripFixture.planItems[0],
        activityType: "travel",
        details: {},
      }),
    ).toBe("transportation");
    expect(
      detailTypeFromItem({
        ...tripFixture.planItems[0],
        activityType: "stay",
        details: {},
      }),
    ).toBe("stay");
    expect(
      detailTypeFromItem({
        ...tripFixture.planItems[0],
        activityType: "experience",
        details: {},
      }),
    ).toBe("experience");
  });

  it("maps detail type + current activity type to stop activity type", () => {
    expect(resolveStopActivityType("transportation", "experience")).toBe("travel");
    expect(resolveStopActivityType("stay", "travel")).toBe("stay");
    expect(resolveStopActivityType("task", "stay")).toBe("experience");
    expect(resolveStopActivityType("experience", "travel")).toBe("experience");
  });

  it("builds compact detail payload only from active fields", () => {
    expect(
      buildStructuredStopDetails("transportation", {
        bookingRef: "",
        budgetNote: "",
        costNote: "paid",
        detail: "",
        destination: "HK",
        entryWindow: "",
        meal: "",
        meetingPoint: "",
        mode: "taxi",
        mustSee: "",
        mustTry: "",
        origin: "DMK",
        provider: "",
        reservationName: "",
        targetItems: "",
        taxRefundNote: "",
        ticketRef: "",
      }),
    ).toEqual({ kind: "transportation", origin: "DMK", destination: "HK", mode: "taxi", costNote: "paid" });
  });

  it("computes duration between times across day boundary", () => {
    expect(durationBetweenTimes("23:00", "01:00", 1)).toBe(120);
    expect(endOffsetDaysBetweenTimes("23:00", "01:00")).toBe(1);
  });

  it("parses route syntax with optional time window", () => {
    expect(parseRouteActivity("DMK -> HKG (8.00am - 11.30am)")).toMatchObject({
      origin: "DMK",
      destination: "HKG",
      startTime: "08:00",
      durationMinutes: 210,
    });
  });

  it("extracts detail strings and ignores non-string values", () => {
    expect(
      structuredStopDetailValues({
        kind: "experience",
        destination: "HK",
        provider: 100,
        meal: "Breakfast",
      }),
    )
      .toEqual({ destination: "HK", meal: "Breakfast" });
    expect(structuredStopDetailValues(undefined)).toEqual({});
  });
});
