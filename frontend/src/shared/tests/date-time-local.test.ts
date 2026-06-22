import { describe, expect, it } from "vitest";

import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "../date-time-local";

describe("date time local helpers", () => {
  it("formats optional ISO-like values for datetime-local inputs", () => {
    expect(toDateTimeLocalValue("2026-06-10T09:45:30.000Z")).toBe("2026-06-10T09:45");
    expect(toDateTimeLocalValue("2026-06-10")).toBe("2026-06-10");
    expect(toDateTimeLocalValue(null)).toBe("");
  });

  it("normalizes datetime-local input values for nullable storage", () => {
    expect(fromDateTimeLocalValue("2026-06-10T09:45")).toBe("2026-06-10T09:45");
    expect(fromDateTimeLocalValue("   ")).toBeNull();
  });
});
