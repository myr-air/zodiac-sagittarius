import { describe, expect, it } from "vitest";
import { enMessages } from "@/src/i18n/messages/en";
import {
  buildEmailLoginSubmitErrorContext,
  emailLoginInvalidCodeError,
  emailLoginPasskeyError,
  emailLoginPasswordSetupError,
  emailLoginPasswordSubmitError,
  emailLoginStartError,
} from "../email-login-submit-errors";

const context = buildEmailLoginSubmitErrorContext({
  emailLoginMessages: enMessages.access.emailLogin,
  messages: enMessages.access.messages,
});

describe("email login submit errors", () => {
  it("builds the shared submit error context once for submit hooks", () => {
    expect(context).toEqual({
      emailLoginMessages: enMessages.access.emailLogin,
      messages: enMessages.access.messages,
    });
  });

  it("maps start, code, setup, and passkey errors through localized access errors", () => {
    expect(emailLoginStartError({ code: "email_delivery_failed" }, context)).toBe(
      enMessages.access.messages.emailDeliveryFailed,
    );
    expect(emailLoginInvalidCodeError(new Error("invalid_request"), context)).toBe(
      enMessages.access.messages.unauthorized,
    );
    expect(emailLoginPasswordSetupError(new Error("fetch failed"), context)).toBe(
      enMessages.access.messages.apiConnectionFailed,
    );
    expect(emailLoginPasskeyError(new Error("unknown"), context)).toBe(
      context.emailLoginMessages.errors.passkeyLoginFailed,
    );
  });

  it("keeps credential failures on the password-login fallback copy", () => {
    expect(
      emailLoginPasswordSubmitError({
        activeFlow: "login",
        caught: { status: 401 },
        context,
      }),
    ).toBe(context.emailLoginMessages.errors.passwordLoginFailed);
  });

  it("uses registration password copy for register flow", () => {
    expect(
      emailLoginPasswordSubmitError({
        activeFlow: "register",
        caught: new Error("unknown"),
        context,
      }),
    ).toBe(context.emailLoginMessages.errors.passwordRegisterFailed);
  });
});
