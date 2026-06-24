import { describe, expect, it } from "vitest";
import {
  accountTripDateString,
  defaultTripStartDate,
  defaultTripTravelDates,
} from "../account-trip-default-dates";

describe("account trip default dates", () => {
  it("formats trip date strings for form defaults and credentials", () => {
    const now = new Date("2026-06-21T17:30:00.000Z");

    expect(accountTripDateString(now)).toBe("2026-06-21");
    expect(defaultTripStartDate(now)).toBe("2026-06-21");
  });

  it("builds the default travel window from one clock read", () => {
    expect(defaultTripTravelDates(new Date("2026-06-21T17:30:00.000Z"))).toEqual({
      startDate: "2026-06-21",
      endDate: "2026-06-24",
    });
  });
});
