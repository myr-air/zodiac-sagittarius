import { describe, expect, it } from "vitest";
import { formatPreviewTravelDate, routeCalendarDays, tripNightCount } from "./account-trip-dates";

describe("account trip date helpers", () => {
  it("re-exports trip date helpers for account trip wizard callers", () => {
    expect(formatPreviewTravelDate("2026-06-21")).toBe("21 Jun 2026");
    expect(tripNightCount("2026-06-21", "2026-06-24", "en")).toBe("3 nights (4 days)");

    const days = routeCalendarDays("2026-06-21", "2026-06-21", "2026-06-24");
    expect(days).toHaveLength(30);
    expect(days.find((day) => day.value === "2026-06-21")).toMatchObject({ dateState: "start", tourDay: 1, tourTone: "odd" });
  });
});
