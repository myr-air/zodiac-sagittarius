import { describe, expect, it } from "vitest";
import {
  addMonths,
  buildCalendarDays,
  normalizeTime,
  pickerWeekdays,
  timePickerPresets,
  toDateValue,
} from "./date-time-picker-model";

describe("date time picker model", () => {
  it("builds Monday-first 42-day calendar grids", () => {
    const days = buildCalendarDays("2026-06-01");

    expect(days).toHaveLength(42);
    expect(days[0]).toEqual({ inMonth: true, label: "1", value: "2026-06-01" });
    expect(days[29]).toEqual({ inMonth: true, label: "30", value: "2026-06-30" });
    expect(days[30]).toEqual({ inMonth: false, label: "1", value: "2026-07-01" });
  });

  it("moves between months while preserving first-of-month values", () => {
    expect(addMonths("2026-01-01", -1)).toBe("2025-12-01");
    expect(addMonths("2026-12-01", 1)).toBe("2027-01-01");
  });

  it("normalizes date and time values for picker controls", () => {
    expect(pickerWeekdays).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
    expect(timePickerPresets).toContain("09:00");
    expect(timePickerPresets).toContain("22:00");
    expect(toDateValue(new Date("2026-06-19T12:34:00"))).toBe("2026-06-19");
    expect(normalizeTime("09:30")).toBe("09:30");
    expect(normalizeTime("9:30")).toBe("");
  });
});
