import { describe, expect, it } from "vitest";
import { classifyTripSeed, toCreatePayload } from "./classify-seed";
import { composeCreateSeed } from "./seed";

/** Draft example literals (create-trip-draft-v15) — independent of helper logic. */
const FLEXIBLE_TEXT = "Chiang Mai with friends, not sure when yet";
const MONTHS_TEXT =
  "Thailand primary, maybe Japan optional, December into January";
const EXACT_TEXT =
  "Europe road trip from 2026-10-05 to 2026-10-18, call it Autumn Loop";

const CHIANG_MAI = "Chiang Mai";
const THAILAND = "Thailand";
const JAPAN = "Japan";
const AUTUMN_LOOP = "Autumn Loop";
const EUROPE = "Europe";
const EXACT_START = "2026-10-05";
const EXACT_END = "2026-10-18";
/** Mission clock (2026-07-20): Dec→Jan spans next calendar year. */
const YEAR = 2026;
const DEC = 11;
const JAN = 0;

describe("classifyTripSeed", () => {
  it("maps free-text into { name, destinations[], when } with flexible|months|exact; composed create payloads never include joinId or joinPassword", () => {
    // Flexible — place + undecided timing
    const flexible = classifyTripSeed(FLEXIBLE_TEXT);
    expect(flexible.name).toBe(CHIANG_MAI);
    expect(flexible.destinations).toEqual([
      { label: CHIANG_MAI, role: "primary" },
    ]);
    expect(flexible.when).toEqual({ mode: "flexible" });

    // Months — primary/optional places + Dec→Jan window
    const months = classifyTripSeed(MONTHS_TEXT);
    expect(months.destinations).toEqual([
      { label: THAILAND, role: "primary" },
      { label: JAPAN, role: "optional" },
    ]);
    expect(months.when).toEqual({
      mode: "months",
      startY: YEAR,
      startM: DEC,
      endY: YEAR + 1,
      endM: JAN,
    });
    expect(months.name).toBe(THAILAND);

    // Exact — ISO range + explicit trip name
    const exact = classifyTripSeed(EXACT_TEXT);
    expect(exact.name).toBe(AUTUMN_LOOP);
    expect(exact.destinations).toEqual([
      { label: EUROPE, role: "primary" },
    ]);
    expect(exact.when).toEqual({
      mode: "exact",
      start: EXACT_START,
      end: EXACT_END,
    });

    // classify → compose → toCreatePayload must never send join credentials
    const composed = composeCreateSeed({
      name: exact.name,
      destinations: exact.destinations,
    });
    expect(composed.ok).toBe(true);
    if (!composed.ok) throw new Error("expected compose success");

    const payload = toCreatePayload({
      name: composed.seed.name,
      destinations: composed.seed.destinations,
      when: exact.when,
    });
    expect(payload.name).toBe(AUTUMN_LOOP);
    expect(payload.destinationLabel).toBe(EUROPE);
    expect(payload).not.toHaveProperty("joinId");
    expect(payload).not.toHaveProperty("joinPassword");
    expect("joinId" in payload).toBe(false);
    expect("joinPassword" in payload).toBe(false);
  });
});
