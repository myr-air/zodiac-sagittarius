"use client";

import { type FormEvent, useState } from "react";
import {
  finishEmailCodeLogin,
  finishEmailPasswordLogin,
  finishEmailRegistrationSetup,
  signInWithEmailPasskey,
} from "./email-login-auth-actions";
import { selectEmailLoginSubmitHandler } from "./email-login-submit-route";
import {
  emailLoginInvalidCodeError,
  emailLoginPasskeyError,
  emailLoginPasswordSetupError,
  emailLoginPasswordSubmitError,
  emailLoginStartError,
} from "./email-login-submit-errors";
import type { UseEmailLoginSubmitActionsProps } from "./use-email-login-submit-actions-params";
import { runEmailLoginSubmission } from "./email-login-submit-runner";

export function useEmailLoginSubmitActions({
  accountClient,
  activeFlow,
  authStep,
  challenge,
  code,
  displayName,
  emailLoginMessages,
  fallbackName,
  isEmailValid,
  locale,
  messages,
  normalizedEmail,
  onError,
  onLoggedIn,
  otpReady,
  password,
  passwordReady,
  trustDevice,
  verifiedRegistrationSession,
  goToSetupStep,
  setChallenge,
  setVerifiedRegistrationSession,
  startResendCooldown,
  updateCode,
}: UseEmailLoginSubmitActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorContext = { emailLoginMessages, messages };

  async function requestEmailCode() {
    if (!isEmailValid || (activeFlow === "register" && !passwordReady)) return;
    await runEmailLoginSubmission({
      onError: (caught) => {
        onError(emailLoginStartError(caught, errorContext));
      },
      setIsSubmitting,
      run: async () => {
        const nextChallenge = await accountClient.startEmailLogin(normalizedEmail);
        setChallenge(nextChallenge);
        startResendCooldown();
        onError(null);
      },
    });
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isEmailValid || !passwordReady) return;
    onError(null);
    if (activeFlow === "register") {
      await requestEmailCode();
      return;
    }
    await signInWithPassword();
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeFlow === "register") {
      await requestEmailCode();
      return;
    }
    await signInWithPassword();
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge || !otpReady) return;
    await runEmailLoginSubmission({
      onError: (caught) => {
        onError(emailLoginInvalidCodeError(caught, errorContext));
      },
      setIsSubmitting,
      run: async () => {
        const session = await finishEmailCodeLogin({
          accountClient,
          activeFlow,
          challenge,
          code,
          trustDevice,
        });
        if (activeFlow === "register") {
          setVerifiedRegistrationSession(session);
          goToSetupStep();
          setChallenge(null);
          updateCode("");
          onError(null);
          return;
        }
        onLoggedIn(session);
      },
    });
  }

  async function submitSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verifiedRegistrationSession || !passwordReady) return;
    await runEmailLoginSubmission({
      onError: (caught) => {
        onError(emailLoginPasswordSetupError(caught, errorContext));
      },
      setIsSubmitting,
      run: async () => {
        const session = await finishEmailRegistrationSetup({
          accountClient,
          displayName,
          fallbackName,
          locale,
          normalizedEmail,
          password,
        });
        onLoggedIn(session);
        onError(null);
      },
    });
  }

  async function signInWithPassword() {
    if (!isEmailValid || !passwordReady) return;
    await runEmailLoginSubmission({
      onError: (caught) => {
        onError(emailLoginPasswordSubmitError({ activeFlow, caught, context: errorContext }));
      },
      setIsSubmitting,
      run: async () => {
        const session = await finishEmailPasswordLogin({
          accountClient,
          activeFlow,
          normalizedEmail,
          password,
          trustDevice,
        });
        onLoggedIn(session);
        onError(null);
      },
    });
  }

  async function signInWithPasskey() {
    if (!isEmailValid) return;
    await runEmailLoginSubmission({
      onError: (caught) => {
        onError(emailLoginPasskeyError(caught, errorContext));
      },
      setIsSubmitting,
      run: async () => {
        const session = await signInWithEmailPasskey({
          accountClient,
          activeFlow,
          normalizedEmail,
          trustDevice,
        });
        onLoggedIn(session);
        onError(null);
      },
    });
  }

  return {
    isSubmitting,
    requestEmailCode,
    signInWithPasskey,
    submitForm: selectEmailLoginSubmitHandler({
      authStep,
      handlers: {
        setup: submitSetup,
        code: submitCode,
        password: submitPassword,
        email: submitEmail,
      },
      hasChallenge: challenge !== null,
    }),
  };
}
