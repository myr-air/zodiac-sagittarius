import { describe, expect, it } from "vitest";
import {
  emailLoginMinPasswordLength,
  isEmailLoginEmailValid,
  isEmailLoginOtpReady,
  isEmailLoginPasswordReady,
  normalizeEmailLoginEmail,
} from "../email-login-validation";

describe("email login validation", () => {
  it("normalizes and validates email input with the account email rule", () => {
    const normalizedEmail = normalizeEmailLoginEmail("  traveler@example.com  ");

    expect(normalizedEmail).toBe("traveler@example.com");
    expect(isEmailLoginEmailValid(normalizedEmail)).toBe(true);
    expect(isEmailLoginEmailValid("bad-email")).toBe(false);
  });

  it("requires exactly six digits for OTP readiness", () => {
    expect(isEmailLoginOtpReady("123456")).toBe(true);
    expect(isEmailLoginOtpReady("12345a")).toBe(false);
    expect(isEmailLoginOtpReady("12345")).toBe(false);
  });

  it("keeps the password readiness threshold in one place", () => {
    expect(emailLoginMinPasswordLength).toBe(8);
    expect(isEmailLoginPasswordReady("1234567")).toBe(false);
    expect(isEmailLoginPasswordReady("12345678")).toBe(true);
  });
});
