import { describe, expect, it } from "vitest";
import {
  detailKeysForType,
  detailTypeFromActivityType,
  readStringDetail,
  stopDetailLabels,
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
    expect(detailTypeFromActivityType("travel")).toBe("transportation");
    expect(detailTypeFromActivityType("stay")).toBe("stay");
    expect(detailTypeFromActivityType("experience")).toBe("experience");
    expect(stopDetailLabels("th").types.transportation).toBe("การเดินทางแบบเป็นช่วง");
    expect(stopDetailLabels("en").types.transportation).toBe("Journey");
  });

  it("reads only string detail values", () => {
    expect(readStringDetail("Gate 3")).toBe("Gate 3");
    expect(readStringDetail(3)).toBe("");
    expect(readStringDetail(null)).toBe("");
  });
});
