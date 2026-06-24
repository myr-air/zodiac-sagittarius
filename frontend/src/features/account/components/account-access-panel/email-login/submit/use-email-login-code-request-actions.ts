"use client";

import type { Dispatch, SetStateAction } from "react";
import type { AccountApiClient, EmailLoginStartResponse } from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import type { AuthFlow } from "../../auth";
import {
  buildEmailLoginSubmitErrorContext,
  emailLoginStartError,
} from "./email-login-submit-errors";
import { runEmailLoginSubmission } from "./email-login-submit-runner";

interface UseEmailLoginCodeRequestActionsOptions {
  accountClient: AccountApiClient;
  activeFlow: AuthFlow;
  emailLoginMessages: Messages["access"]["emailLogin"];
  isEmailValid: boolean;
  messages: Messages["access"]["messages"];
  normalizedEmail: string;
  onError: (message: string | null) => void;
  passwordReady: boolean;
  setChallenge: (challenge: EmailLoginStartResponse | null) => void;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  startResendCooldown: () => void;
}

export function useEmailLoginCodeRequestActions({
  accountClient,
  activeFlow,
  emailLoginMessages,
  isEmailValid,
  messages,
  normalizedEmail,
  onError,
  passwordReady,
  setChallenge,
  setIsSubmitting,
  startResendCooldown,
}: UseEmailLoginCodeRequestActionsOptions) {
  const errorContext = buildEmailLoginSubmitErrorContext({ emailLoginMessages, messages });

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

  return {
    requestEmailCode,
  };
}
