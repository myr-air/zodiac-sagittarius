import { describe, expect, it } from "vitest";
import { messages } from "@/src/i18n/messages";
import {
  emailLoginCredentialsLabels,
  emailLoginMethodsLabels,
  emailLoginOtpLabels,
  emailLoginPasswordLabels,
  emailLoginSetupLabels,
} from "../account-email-login-step-labels";

const emailLoginMessages = messages.en.access.emailLogin;

describe("email login step labels", () => {
  it("maps OTP copy and keeps resend cooldown formatted lazily", () => {
    const labels = emailLoginOtpLabels(emailLoginMessages);

    expect(labels.verifyEmail).toBe(emailLoginMessages.verifyEmail);
    expect(labels.resendCooldown(7)).toBe(emailLoginMessages.resendCooldown({ seconds: 7 }));
  });

  it("maps credentials and methods step copy from the shared email-login messages", () => {
    expect(emailLoginCredentialsLabels(emailLoginMessages)).toMatchObject({
      email: emailLoginMessages.email,
      password: emailLoginMessages.password,
      usePasskeyInstead: emailLoginMessages.usePasskeyInstead,
      useSignInCodeInstead: emailLoginMessages.useSignInCodeInstead,
    });
    expect(emailLoginMethodsLabels(emailLoginMessages)).toMatchObject({
      sendSignInCode: emailLoginMessages.sendSignInCode,
      signInWithPasskey: emailLoginMessages.signInWithPasskey,
      signInWithPassword: emailLoginMessages.signInWithPassword,
    });
  });

  it("maps setup and password step copy without UI dependencies", () => {
    expect(emailLoginSetupLabels(emailLoginMessages)).toMatchObject({
      displayName: emailLoginMessages.displayName,
      finishSetup: emailLoginMessages.finishSetup,
      homeBase: emailLoginMessages.homeBase,
    });
    expect(emailLoginPasswordLabels(emailLoginMessages)).toMatchObject({
      chooseAnotherMethod: emailLoginMessages.chooseAnotherMethod,
      passwordHint: emailLoginMessages.passwordHint,
      signInWithPassword: emailLoginMessages.signInWithPassword,
    });
  });
});
