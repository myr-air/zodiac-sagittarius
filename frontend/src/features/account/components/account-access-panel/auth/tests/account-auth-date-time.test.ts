import { describe, expect, it } from "vitest";
import { formatDateTime } from "../account-auth-date-time";

describe("account auth date-time", () => {
  it("formats account date-time values through the shared display helper", () => {
    expect(formatDateTime("2026-06-18T12:30:00.000Z", "en")).toContain("2026");
    expect(formatDateTime("2026-06-18T12:30:00.000Z", "th")).toContain("2569");
  });
});
