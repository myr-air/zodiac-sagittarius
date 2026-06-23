import { describe, expect, it } from "vitest";
import {
  arrayBufferToBase64Url,
  errorMessage,
  formatDateTime,
} from "../account-auth-support";

describe("account auth support", () => {
  it("keeps error helpers available through the compatibility support module", () => {
    expect(typeof errorMessage).toBe("function");
  });

  it("encodes ArrayBuffers with base64url formatting", () => {
    const bytes = new Uint8Array([251, 255, 254]);
    expect(arrayBufferToBase64Url(bytes.buffer)).toBe("-__-");
  });

  it("formats account date-time values through the shared display helper", () => {
    expect(formatDateTime("2026-06-18T12:30:00.000Z", "en")).toContain("2026");
    expect(formatDateTime("2026-06-18T12:30:00.000Z", "th")).toContain("2569");
  });
});
