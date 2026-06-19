import { describe, expect, it } from "vitest";
import {
  bookingTypeIcon,
  formatDateTime,
  statusBadgeClassName,
  typeIconClassName,
} from "./booking-display";

describe("booking display helpers", () => {
  it("formats booking date input values without changing stored semantics", () => {
    expect(formatDateTime(null)).toBe("-");
    expect(formatDateTime("not-a-date")).toBe("not-a-date");
    expect(formatDateTime("2026-06-18T12:30:00.000Z")).toContain("Jun");
  });

  it("keeps selection and visual token helpers centralized", () => {
    expect(bookingTypeIcon("hotel")).toBe("home");
    expect(typeIconClassName("passport")).toContain("text-(--color-primary-strong)");
    expect(statusBadgeClassName("needs_action")).toContain("text-(--color-warning-strong)");
    expect(statusBadgeClassName("expired")).toContain("text-(--color-danger)");
  });
});
