import { describe, expect, it } from "vitest";
import { formatTripRange } from "../page-header-date";

describe("page header date helpers", () => {
  it("formats trip ranges while preserving invalid values", () => {
    expect(formatTripRange("bad-date", "bad-date")).toBe("bad-date – bad-date");
    expect(formatTripRange("2026-05-28", "2026-06-02")).toBe("May 28 – Jun 2, 2026");
    expect(formatTripRange("2026-12-30", "2027-01-02")).toBe("Dec 30, 2026 – Jan 2, 2027");
    expect(formatTripRange("2026-05-28", "2026-06-02", "th")).toBe("28 พ.ค. – 2 มิ.ย. 2026");
  });
});
