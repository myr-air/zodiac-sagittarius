import { describe, expect, it } from "vitest";
import type { AuthFlow } from "../auth";
import {
  buildEmailLoginStepMeta,
  emailLoginStepHeading,
  emailLoginStepProgress,
  resolveEmailLoginVisualStep,
  type EmailLoginAuthStep,
} from "./account-email-login-step-meta";

const headingLabels = {
  expiresAt: ({ value }: { value: string }) => `Expires ${value}`,
  loginCredentialsDetail: "Login detail",
  loginCredentialsTitle: "Login title",
  methodDetail: "Method detail",
  methodTitle: "Method title",
  passwordDetail: "Password detail",
  passwordTitle: "Password title",
  registerCredentialsDetail: "Register detail",
  registerCredentialsTitle: "Register title",
  registerPasswordDetail: "Register password detail",
  setupDetail: "Setup detail",
  setupTitle: "Setup title",
  stepLogin: ({ current, total }: { current: number; total: number }) => `Login ${current}/${total}`,
  stepRegister: ({ current, total }: { current: number; total: number }) => `Register ${current}/${total}`,
  verifyTitle: "Verify title",
};

describe("email login step metadata", () => {
  it("uses the OTP visual step while a challenge is active", () => {
    expect(resolveEmailLoginVisualStep("email", true)).toBe("otp");
    expect(resolveEmailLoginVisualStep("password", false)).toBe("password");
  });

  it("maps register and login progress separately", () => {
    expect(emailLoginStepProgress("register", "email")).toEqual({ current: 1, total: 3 });
    expect(emailLoginStepProgress("register", "otp")).toEqual({ current: 2, total: 3 });
    expect(emailLoginStepProgress("register", "setup")).toEqual({ current: 3, total: 3 });
    expect(emailLoginStepProgress("login", "email")).toEqual({ current: 1, total: 2 });
    expect(emailLoginStepProgress("login", "otp")).toEqual({ current: 2, total: 2 });
  });

  it("selects heading metadata for each non-OTP step", () => {
    const cases: Array<[EmailLoginAuthStep, AuthFlow, string, string, string]> = [
      ["email", "login", "users", "Login title", "Login detail"],
      ["email", "register", "users", "Register title", "Register detail"],
      ["methods", "login", "users", "Method title", "Method detail"],
      ["password", "login", "key", "Password title", "Password detail"],
      ["password", "register", "key", "Password title", "Register password detail"],
      ["setup", "register", "users", "Setup title", "Setup detail"],
    ];

    for (const [authStep, activeFlow, icon, title, detail] of cases) {
      expect(emailLoginStepHeading({ activeFlow, authStep, locale: "en", messages: headingLabels })).toMatchObject({ detail, icon, title });
    }
  });

  it("uses challenge expiry metadata while verifying OTP", () => {
    expect(emailLoginStepHeading({
      activeFlow: "login",
      authStep: "email",
      challengeExpiresAt: "2026-06-17T12:00:00.000Z",
      locale: "en",
      messages: headingLabels,
    })).toMatchObject({
      icon: "settings",
      title: "Verify title",
    });
  });

  it("builds panel step metadata from the active challenge state", () => {
    expect(buildEmailLoginStepMeta({
      activeFlow: "register",
      authStep: "email",
      challengeExpiresAt: "2026-06-17T12:00:00.000Z",
      locale: "en",
      messages: headingLabels,
    })).toMatchObject({
      label: "Register 2/3",
      visualStep: "otp",
      heading: {
        icon: "settings",
        title: "Verify title",
      },
    });
  });
});
