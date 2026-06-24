import { describe, expect, it, vi } from "vitest";
import { enMessages } from "@/src/i18n/messages/en";
import { buildEmailLoginPanelStateResult } from "../email-login-panel-state-result";

describe("email-login-panel-state-result", () => {
  it("assembles the public panel state shape from focused state slices", () => {
    const actions = {
      changeEmail: vi.fn(),
      chooseMethods: vi.fn(),
      requestEmailCode: vi.fn(),
      resetChallenge: vi.fn(),
      setDisplayName: vi.fn(),
      setEmail: vi.fn(),
      setHomeBase: vi.fn(),
      setPassword: vi.fn(),
      setTrustDevice: vi.fn(),
      showPasswordStep: vi.fn(),
      signInWithPasskey: vi.fn(),
      submitForm: vi.fn(),
      switchFlow: vi.fn(),
      updateCode: vi.fn(),
    };

    const result = buildEmailLoginPanelStateResult({
      activeFlow: "login",
      challengeState: {
        challenge: null,
        resendCooldown: 12,
      },
      derivedState: {
        codeHintId: "code-hint",
        codeInputId: "code",
        emailHintId: "email-hint",
        emailInputId: "email",
        formErrorId: "form-error",
        isEmailInvalid: false,
        isEmailValid: true,
        isPasswordInvalid: false,
        normalizedEmail: "traveler@example.com",
        otpReady: true,
        passwordAutocomplete: "current-password",
        passwordHintId: "password-hint",
        passwordInputId: "password",
        passwordReady: true,
      },
      emailLoginMessages: enMessages.access.emailLogin,
      entryActions: {
        changeEmail: actions.changeEmail,
        chooseMethods: actions.chooseMethods,
        resetChallenge: actions.resetChallenge,
        showPasswordStep: actions.showPasswordStep,
        switchFlow: actions.switchFlow,
      },
      formState: {
        code: "123456",
        displayName: "Traveler",
        email: "traveler@example.com",
        homeBase: "Bangkok",
        password: "password1",
        trustDevice: true,
        clearCodeAndPassword: vi.fn(),
        resetEntryFields: vi.fn(),
        setDisplayName: actions.setDisplayName,
        setEmail: actions.setEmail,
        setHomeBase: actions.setHomeBase,
        setPassword: actions.setPassword,
        setTrustDevice: actions.setTrustDevice,
        updateCode: actions.updateCode,
      },
      stepMeta: {
        heading: {
          detail: "Use your email",
          icon: "users",
          title: "Sign in",
        },
        label: "Step 1 of 2",
        visualStep: "email",
      },
      stepNavigation: {
        authStep: "email",
        transitionDirection: "forward",
      },
      submitActions: {
        isSubmitting: false,
        requestEmailCode: actions.requestEmailCode,
        signInWithPasskey: actions.signInWithPasskey,
        submitForm: actions.submitForm,
      },
    });

    expect(result).toMatchObject({
      activeFlow: "login",
      authStep: "email",
      code: "123456",
      codeHintId: "code-hint",
      email: "traveler@example.com",
      emailLoginMessages: enMessages.access.emailLogin,
      normalizedEmail: "traveler@example.com",
      resendCooldown: 12,
      stepLabel: "Step 1 of 2",
      trustDevice: true,
      visualStep: "email",
    });
    expect(result.changeEmail).toBe(actions.changeEmail);
    expect(result.submitForm).toBe(actions.submitForm);
    expect(result.setEmail).toBe(actions.setEmail);
  });
});
