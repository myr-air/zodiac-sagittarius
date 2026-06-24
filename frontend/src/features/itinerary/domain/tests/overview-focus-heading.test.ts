import { describe, expect, it } from "vitest";
import { overviewFocusHeading } from "../overview-focus-heading";

describe("overview focus heading", () => {
  it("uses the supplied active-trip label", () => {
    expect(
      overviewFocusHeading({
        countdownType: "active",
        focusTodayLabel: "Focus today",
        locale: "en",
      }),
    ).toBe("Focus today");
  });

  it("builds localized incoming and completed headings", () => {
    expect(
      overviewFocusHeading({
        countdownType: "incoming",
        focusTodayLabel: "Focus today",
        locale: "en",
      }),
    ).toBe("First Stop Preview");
    expect(
      overviewFocusHeading({
        countdownType: "incoming",
        focusTodayLabel: "Focus today",
        locale: "th",
      }),
    ).toBe("จุดสตาร์ทแรกของทริป");
    expect(
      overviewFocusHeading({
        countdownType: "completed",
        focusTodayLabel: "Focus today",
        locale: "en",
      }),
    ).toBe("Memories of the Journey");
    expect(
      overviewFocusHeading({
        countdownType: "completed",
        focusTodayLabel: "Focus today",
        locale: "th",
      }),
    ).toBe("ย้อนรอยความทรงจำ");
  });
});
