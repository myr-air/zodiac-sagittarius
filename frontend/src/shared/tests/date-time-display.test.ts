import { describe, expect, it } from "vitest";
import {
  displayDateTimeLocaleCode,
  displayGregorianDateTimeLocaleCode,
  formatDisplayDateTime,
  formatOptionalDisplayDateTime,
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
