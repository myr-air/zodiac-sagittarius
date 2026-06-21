import { describe, expect, it } from "vitest";
import { messages } from "@/src/i18n/messages";
import {
  ACCESS_ERROR_CODES,
  arrayBufferToBase64Url,
  errorMessage,
  isUnauthenticated,
  passwordLoginErrorMessage,
  formatDateTime,
  rawErrorMessage,
} from "../account-auth-support";

const labels = messages.en.access.messages;

describe("account auth support", () => {
  it("normalizes network and API errors into account access copy", () => {
    expect(rawErrorMessage(new Error("Failed to fetch"), "fallback")).toBe(ACCESS_ERROR_CODES.apiConnectionFailed);
    expect(errorMessage(new Error("Failed to fetch"), "fallback", labels)).toBe(labels.apiConnectionFailed);
    expect(errorMessage({ code: "not_found", status: 404 }, "fallback", labels)).toBe(labels.notFound);
  });

  it("keeps credential failures on password login copy", () => {
    expect(passwordLoginErrorMessage({ status: 401 }, "Try again", labels)).toBe("Try again");
    expect(isUnauthenticated({ status: 401 })).toBe(true);
    expect(isUnauthenticated({ status: 403 })).toBe(false);
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
