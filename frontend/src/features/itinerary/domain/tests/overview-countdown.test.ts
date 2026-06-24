import { describe, expect, it, vi } from "vitest";
import type { Locale } from "@/src/i18n/types";
import { getCountdownBadge } from "../overview-countdown";

describe("overview countdown helpers", () => {
  it("computes countdown badge for incoming, active, and completed trips", () => {
    const localeEn: Locale = "en";
    const localeTh: Locale = "th";
    vi.useFakeTimers({ now: new Date("2026-06-19T12:00:00.000Z") });

    expect(getCountdownBadge("2026-06-21", "2026-06-25", localeTh)).toMatchObject({
      type: "incoming",
      text: "จะเริ่มในอีก 2 วัน",
    });
    expect(getCountdownBadge("2026-06-18", "2026-06-21", localeEn)).toMatchObject({
      type: "active",
      text: "Day 2 of 4",
    });
    expect(getCountdownBadge("2026-05-01", "2026-05-10", localeEn)).toMatchObject({
      type: "completed",
      text: "Trip Completed",
    });

    vi.useRealTimers();
  });
});
