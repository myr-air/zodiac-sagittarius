import { describe, expect, it } from "vitest";
import { formatAccountGreeting } from "./greeting";

/** Independent displayName literal from GET /account profile (draft v3 hero). */
const DISPLAY_NAME = "Aom";

/** Local-clock fixtures — hour is the only time-of-day input that matters. */
const MORNING = new Date(2026, 6, 19, 9, 0, 0);
const AFTERNOON = new Date(2026, 6, 19, 14, 0, 0);
const EVENING = new Date(2026, 6, 19, 19, 0, 0);

describe("formatAccountGreeting", () => {
  it("builds time-of-day greeting using profile.displayName (draft: Good Morning, Aom)", () => {
    // Draft v3 hero: <h1>Good Morning, Aom</h1>
    expect(formatAccountGreeting(DISPLAY_NAME, MORNING)).toBe(
      "Good Morning, Aom",
    );
    expect(formatAccountGreeting(DISPLAY_NAME, AFTERNOON)).toBe(
      "Good Afternoon, Aom",
    );
    expect(formatAccountGreeting(DISPLAY_NAME, EVENING)).toBe(
      "Good Evening, Aom",
    );
  });
});
