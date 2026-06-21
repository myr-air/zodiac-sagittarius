import { describe, expect, it } from "vitest";
import { buildEmailLoginPanelDerivedState } from "../email-login-panel-derived-state";

describe("email-login-panel-derived-state", () => {
  it("derives login validation state and stable input ids", () => {
    expect(
      buildEmailLoginPanelDerivedState({
        activeFlow: "login",
        code: "123456",
        email: "  traveler@example.com  ",
        password: "password1",
      }),
    ).toMatchObject({
      codeHintId: "account-login-code-hint",
      codeInputId: "account-login-code",
      emailHintId: "account-login-email-hint",
      emailInputId: "account-login-email",
      formErrorId: "account-login-error",
      isEmailInvalid: false,
      isEmailValid: true,
      isPasswordInvalid: false,
      normalizedEmail: "traveler@example.com",
      otpReady: true,
      passwordAutocomplete: "current-password",
      passwordHintId: "account-login-password-hint",
      passwordInputId: "account-login-password",
      passwordReady: true,
    });
  });

  it("derives register validation failures without accepting partial OTP codes", () => {
    expect(
      buildEmailLoginPanelDerivedState({
        activeFlow: "register",
        code: "12345a",
        email: "bad-email",
        password: "short",
      }),
    ).toMatchObject({
      isEmailInvalid: true,
      isEmailValid: false,
      isPasswordInvalid: true,
      otpReady: false,
      passwordAutocomplete: "new-password",
      passwordReady: false,
    });
  });
});
