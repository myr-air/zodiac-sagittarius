"use client";

import { type FormEvent, useState } from "react";
import type {
  AccountApiClient,
  AccountSession,
  EmailLoginStartResponse,
} from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import {
  errorMessage,
  passwordLoginErrorMessage,
} from "../auth";
import type { AuthFlow } from "../auth";
import type { EmailLoginAuthStep } from "./account-email-login-step-meta";
import {
  finishEmailCodeLogin,
  finishEmailPasswordLogin,
  finishEmailRegistrationSetup,
  signInWithEmailPasskey,
} from "./email-login-auth-actions";
import { selectEmailLoginSubmitHandler } from "./email-login-submit-route";
import { runEmailLoginSubmission } from "./email-login-submit-runner";

interface UseEmailLoginSubmitActionsProps {
  accountClient: AccountApiClient;
  activeFlow: AuthFlow;
  authStep: EmailLoginAuthStep;
  challenge: EmailLoginStartResponse | null;
  code: string;
  displayName: string;
  emailLoginMessages: Messages["access"]["emailLogin"];
  fallbackName: string;
  isEmailValid: boolean;
  locale: Locale;
  messages: Messages["access"]["messages"];
  normalizedEmail: string;
  onError: (message: string | null) => void;
  onLoggedIn: (session: AccountSession) => void;
  otpReady: boolean;
  password: string;
  passwordReady: boolean;
  trustDevice: boolean;
  verifiedRegistrationSession: AccountSession | null;
  goToSetupStep: () => void;
  setChallenge: (challenge: EmailLoginStartResponse | null) => void;
  setVerifiedRegistrationSession: (session: AccountSession | null) => void;
  startResendCooldown: () => void;
  updateCode: (value: string) => void;
}

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

  async function requestEmailCode() {
    if (!isEmailValid || (activeFlow === "register" && !passwordReady)) return;
    await runEmailLoginSubmission({
      onError: (caught) => {
        onError(errorMessage(caught, emailLoginMessages.errors.startFailed, messages));
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
        onError(errorMessage(caught, emailLoginMessages.errors.invalidCode, messages));
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
        onError(errorMessage(caught, emailLoginMessages.errors.passwordRegisterFailed, messages));
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
        onError(
          activeFlow === "register"
            ? errorMessage(caught, emailLoginMessages.errors.passwordRegisterFailed, messages)
            : passwordLoginErrorMessage(caught, emailLoginMessages.errors.passwordLoginFailed, messages),
        );
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
        onError(errorMessage(caught, emailLoginMessages.errors.passkeyLoginFailed, messages));
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
