import { describe, expect, it } from "vitest";
import {
  bookingTypeIcon,
  statusBadgeClassName,
  typeIconClassName,
} from "../booking-display-visuals";

describe("booking display visuals", () => {
  it("centralizes booking type icons and token classes", () => {
    expect(bookingTypeIcon("hotel")).toBe("home");
    expect(bookingTypeIcon("passport")).toBe("document");
    expect(typeIconClassName("passport")).toContain("text-(--color-primary-strong)");
    expect(typeIconClassName("other")).toContain("text-(--color-text-muted)");
  });

  it("centralizes booking status badge token classes", () => {
    expect(statusBadgeClassName("needs_action")).toContain("text-(--color-warning-strong)");
    expect(statusBadgeClassName("confirmed")).toContain("text-(--color-success-strong)");
    expect(statusBadgeClassName("expired")).toContain("text-[#b91c1c]");
    expect(statusBadgeClassName("booked")).toContain("text-(--color-route)");
  });
});
