import { describe, expect, it } from "vitest";
import {
  formatPreviewTravelDate,
  routeCalendarDays,
  tripNightCount,
} from "../../metadata";

describe("trip date calendar helpers", () => {
  it("formats preview dates and night counts", () => {
    expect(formatPreviewTravelDate("2026-06-21")).toBe("21 Jun 2026");
    expect(formatPreviewTravelDate("")).toBe("--");
    expect(formatPreviewTravelDate("not-a-date")).toBe("not-a-date");
    expect(tripNightCount("2026-06-21", "2026-06-24", "en")).toBe("3 nights (4 days)");
    expect(tripNightCount("2026-06-24", "2026-06-21", "th")).toBe("ยังไม่กำหนด");
  });

  it("builds month calendar days with trip range metadata", () => {
    const days = routeCalendarDays("2026-06-21", "2026-06-21", "2026-06-24");
    expect(days).toHaveLength(30);
    expect(days.find((day) => day.value === "2026-06-21")).toMatchObject({ dateState: "start", tourDay: 1, tourTone: "odd" });
    expect(days.find((day) => day.value === "2026-06-22")).toMatchObject({ dateState: "in-range", tourDay: 2, tourTone: "even" });
    expect(days.find((day) => day.value === "2026-06-24")).toMatchObject({ dateState: "end", tourDay: 4, tourTone: "even" });
  });
});
