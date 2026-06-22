import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  buildStructuredStopDetails,
  detailKeysForType,
  detailTypeFromActivityType,
  detailTypeFromItem,
  readStringDetail,
  resolveStopActivityType,
  stopDetailLabels,
  stopDialogDetailTypeOptions,
  stopDialogDetailTypeToActivityType,
  structuredStopDetailValues,
} from "../stop-details";

describe("stop details model", () => {
  it("keeps detail field sets owned by detail type", () => {
    expect(detailKeysForType("transportation")).toEqual([
      "origin",
      "destination",
      "mode",
      "ticketRef",
      "costNote",
    ]);
    expect(detailKeysForType("stay")).toEqual(["entryWindow", "bookingRef", "detail"]);
    expect(detailKeysForType("task")).toEqual(["detail", "meetingPoint"]);
  });

  it("maps activity types and localized labels for stop detail mode", () => {
    expect(stopDialogDetailTypeOptions).toEqual([
      "transportation",
      "stay",
      "experience",
      "task",
    ]);
    expect(stopDialogDetailTypeToActivityType.transportation).toBe("travel");
    expect(stopDialogDetailTypeToActivityType.stay).toBe("stay");
    expect(stopDialogDetailTypeToActivityType.task).toBe("experience");
    expect(stopDialogDetailTypeToActivityType.experience).toBe("experience");
    expect(detailTypeFromActivityType("travel")).toBe("transportation");
    expect(detailTypeFromActivityType("stay")).toBe("stay");
    expect(detailTypeFromActivityType("experience")).toBe("experience");
    expect(stopDetailLabels("th").types.transportation).toBe("การเดินทางแบบเป็นช่วง");
    expect(stopDetailLabels("en").types.transportation).toBe("Journey");
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

  it("maps detail type plus current activity type to stop activity type", () => {
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
    ).toEqual({
      kind: "transportation",
      origin: "DMK",
      destination: "HK",
      mode: "taxi",
      costNote: "paid",
    });
  });

  it("reads only string detail values", () => {
    expect(readStringDetail("Gate 3")).toBe("Gate 3");
    expect(readStringDetail(3)).toBe("");
    expect(readStringDetail(null)).toBe("");
    expect(
      structuredStopDetailValues({
        kind: "experience",
        destination: "HK",
        provider: 100,
        meal: "Breakfast",
      }),
    ).toEqual({ destination: "HK", meal: "Breakfast" });
    expect(structuredStopDetailValues(undefined)).toEqual({});
  });
});
