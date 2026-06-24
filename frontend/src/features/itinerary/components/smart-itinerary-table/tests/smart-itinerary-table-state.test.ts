import { describe, expect, it } from "vitest";
import { toggleCollapsedDay } from "../smart-itinerary-table-state";

describe("smart itinerary table state", () => {
  it("adds a day when it is expanded", () => {
    expect(toggleCollapsedDay([], "2026-06-20")).toEqual(["2026-06-20"]);
  });

  it("removes a day when it is already collapsed", () => {
    expect(
      toggleCollapsedDay(["2026-06-19", "2026-06-20"], "2026-06-19"),
    ).toEqual(["2026-06-20"]);
  });

  it("preserves the collapse order of other days", () => {
    expect(
      toggleCollapsedDay(["2026-06-18", "2026-06-20"], "2026-06-19"),
    ).toEqual(["2026-06-18", "2026-06-20", "2026-06-19"]);
  });
});
