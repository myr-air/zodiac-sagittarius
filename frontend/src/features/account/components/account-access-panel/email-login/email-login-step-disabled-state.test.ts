import { describe, expect, it } from "vitest";
import { buildEmailLoginStepDisabledState } from "./email-login-step-disabled-state";

describe("email login step disabled state", () => {
  it("disables credential primary actions until email and password are ready", () => {
    expect(
      buildEmailLoginStepDisabledState({
        activeFlow: "login",
        isEmailValid: true,
        isSubmitting: false,
        passwordReady: false,
        resendCooldown: 0,
      }).credentialsPrimary,
    ).toBe(true);

    expect(
      buildEmailLoginStepDisabledState({
        activeFlow: "login",
        isEmailValid: true,
        isSubmitting: false,
        passwordReady: true,
        resendCooldown: 0,
      }).credentialsPrimary,
    ).toBe(false);
  });

  it("disables alternate actions only for invalid email or active submit", () => {
    expect(
      buildEmailLoginStepDisabledState({
        activeFlow: "register",
        isEmailValid: true,
        isSubmitting: false,
        passwordReady: false,
        resendCooldown: 0,
      }).alternateActions,
    ).toBe(false);

    expect(
      buildEmailLoginStepDisabledState({
        activeFlow: "register",
        isEmailValid: true,
        isSubmitting: true,
        passwordReady: true,
        resendCooldown: 0,
      }).alternateActions,
    ).toBe(true);
  });

  it("requires ready registration password before resending a code", () => {
    expect(
      buildEmailLoginStepDisabledState({
        activeFlow: "register",
        isEmailValid: true,
        isSubmitting: false,
        passwordReady: false,
        resendCooldown: 0,
      }).codeResend,
    ).toBe(true);

    expect(
      buildEmailLoginStepDisabledState({
        activeFlow: "login",
        isEmailValid: true,
        isSubmitting: false,
        passwordReady: false,
        resendCooldown: 0,
      }).codeResend,
    ).toBe(false);
  });

  it("disables code resend during cooldown", () => {
    expect(
      buildEmailLoginStepDisabledState({
        activeFlow: "login",
        isEmailValid: true,
        isSubmitting: false,
        passwordReady: true,
        resendCooldown: 12,
      }).codeResend,
    ).toBe(true);
  });
});
