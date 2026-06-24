import { describe, expect, it } from "vitest";
import {
  displayDateTimeLocaleCode,
  displayGregorianDateTimeLocaleCode,
  formatDateOnlyDisplay,
  formatDisplayDateTime,
  formatOptionalDisplayDateTime,
  parseDateOnlyValue,
} from "../date-time-display";

describe("date time display helpers", () => {
  it("maps supported app locales to Intl locale codes", () => {
    expect(displayDateTimeLocaleCode("en")).toBe("en-US");
    expect(displayDateTimeLocaleCode("th")).toBe("th-TH");
  });

  it("maps app locales to Gregorian Intl locale codes when Buddhist years would be misleading", () => {
    expect(displayGregorianDateTimeLocaleCode("en")).toBe("en-US");
    expect(displayGregorianDateTimeLocaleCode("th")).toBe("th-TH-u-ca-gregory");
  });

  it("formats required and optional date-time values through one Intl helper", () => {
    expect(formatDisplayDateTime("2026-06-18T12:30:00.000Z", "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })).toContain("2026");
    expect(formatDisplayDateTime(new Date("2026-06-18T00:00:00"), "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })).toBe("18 Jun 2026");

    expect(formatOptionalDisplayDateTime({
      emptyValue: "-",
      invalidValue: (value) => value.slice(0, 10),
      locale: "en-US",
      options: { day: "numeric", hour: "2-digit", minute: "2-digit", month: "short" },
      value: "2026-06-18T12:30:00.000Z",
    })).toContain("Jun");
  });

  it("parses and formats date-only values with explicit invalid fallbacks", () => {
    expect(parseDateOnlyValue("2026-07-13")?.getFullYear()).toBe(2026);
    expect(parseDateOnlyValue("not-a-date")).toBeNull();

    expect(formatDateOnlyDisplay({
      locale: "en-US",
      options: { weekday: "short", month: "short", day: "numeric" },
      value: "2026-07-13",
    })).toBe("Mon, Jul 13");
    expect(formatDateOnlyDisplay({
      locale: "en-US",
      options: { weekday: "short", month: "short", day: "numeric" },
      value: "not-a-date",
    })).toBe("not-a-date");
  });

  it("keeps nullable and invalid fallbacks explicit for optional displays", () => {
    expect(formatOptionalDisplayDateTime({
      emptyValue: "-",
      invalidValue: (value) => value.slice(0, 10),
      locale: "en-US",
      options: { day: "numeric", hour: "2-digit", minute: "2-digit", month: "short" },
      value: null,
    })).toBe("-");
    expect(formatOptionalDisplayDateTime({
      emptyValue: "-",
      invalidValue: (value) => value.slice(0, 10),
      locale: "en-US",
      options: { day: "numeric", hour: "2-digit", minute: "2-digit", month: "short" },
      value: "not-a-date",
    })).toBe("not-a-date");
  });
});
