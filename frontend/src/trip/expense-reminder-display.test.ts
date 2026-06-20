import { describe, expect, it } from "vitest";
import { formatReminderDate } from "./expense-reminder-display";

describe("expense reminder display", () => {
  it("keeps invalid reminder dates readable", () => {
    expect(formatReminderDate("not-a-date", "en")).toBe("not-a-date");
  });

  it("formats reminder timestamps in the selected locale", () => {
    expect(formatReminderDate("2026-06-18T12:30:00.000Z", "en")).toContain("2026");
    expect(formatReminderDate("2026-06-18T12:30:00.000Z", "th")).toContain("2026");
  });
});
