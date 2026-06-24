import { describe, expect, it } from "vitest";
import { formatReminderDate } from "../../expenses";

describe("expense reminder display", () => {
  it("keeps invalid reminder dates readable", () => {
    expect(formatReminderDate("not-a-date", "en")).toBe("not-a-date");
  });

  it("formats reminder timestamps in the selected locale", () => {
    expect(formatReminderDate("2026-06-18T12:30:00.000Z", "en")).toBe("Jun 18, 2026, 07:30 PM");
    expect(formatReminderDate("2026-06-18T12:30:00.000Z", "th")).toContain("2026");
  });

  it("keeps Thai reminder years Gregorian for trip finance records", () => {
    expect(formatReminderDate("2026-06-18T12:30:00.000Z", "th")).not.toContain("2569");
  });
});
