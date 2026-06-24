"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
  AccountApiClient,
  AccountSession,
  EmailLoginStartResponse,
} from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import type { AuthFlow } from "../../auth";
import {
  finishEmailCodeLogin,
  finishEmailRegistrationSetup,
} from "./email-login-auth-actions";
import {
  buildEmailLoginSubmitErrorContext,
  emailLoginInvalidCodeError,
  emailLoginPasswordSetupError,
} from "./email-login-submit-errors";
import { runEmailLoginSubmission } from "./email-login-submit-runner";

interface UseEmailLoginRegistrationActionsOptions {
  accountClient: AccountApiClient;
  activeFlow: AuthFlow;
  challenge: EmailLoginStartResponse | null;
  code: string;
  displayName: string;
  emailLoginMessages: Messages["access"]["emailLogin"];
  fallbackName: string;
  goToSetupStep: () => void;
  locale: Locale;
  messages: Messages["access"]["messages"];
  normalizedEmail: string;
  onError: (message: string | null) => void;
  onLoggedIn: (session: AccountSession) => void;
  otpReady: boolean;
  password: string;
  passwordReady: boolean;
  setChallenge: (challenge: EmailLoginStartResponse | null) => void;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  setVerifiedRegistrationSession: (session: AccountSession | null) => void;
  trustDevice: boolean;
  updateCode: (value: string) => void;
  verifiedRegistrationSession: AccountSession | null;
}

export function useEmailLoginRegistrationActions({
  accountClient,
  activeFlow,
  challenge,
  code,
  displayName,
  emailLoginMessages,
  fallbackName,
  goToSetupStep,
  locale,
  messages,
  normalizedEmail,
  onError,
  onLoggedIn,
  otpReady,
  password,
  passwordReady,
  setChallenge,
  setIsSubmitting,
  setVerifiedRegistrationSession,
  trustDevice,
  updateCode,
  verifiedRegistrationSession,
}: UseEmailLoginRegistrationActionsOptions) {
  const errorContext = buildEmailLoginSubmitErrorContext({ emailLoginMessages, messages });

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

  return {
    submitCode,
    submitSetup,
  };
}
