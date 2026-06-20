"use client";

import type { Dispatch, SetStateAction } from "react";
import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import type { AuthFlow } from "../../auth";
import {
  finishEmailPasswordLogin,
  signInWithEmailPasskey,
} from "./email-login-auth-actions";
import {
  emailLoginPasskeyError,
  emailLoginPasswordSubmitError,
} from "./email-login-submit-errors";
import { runEmailLoginSubmission } from "./email-login-submit-runner";

interface UseEmailLoginSignInActionsOptions {
  accountClient: AccountApiClient;
  activeFlow: AuthFlow;
  emailLoginMessages: Messages["access"]["emailLogin"];
  isEmailValid: boolean;
  messages: Messages["access"]["messages"];
  normalizedEmail: string;
  onError: (message: string | null) => void;
  onLoggedIn: (session: AccountSession) => void;
  password: string;
  passwordReady: boolean;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  trustDevice: boolean;
}

export function useEmailLoginSignInActions({
  accountClient,
  activeFlow,
  emailLoginMessages,
  isEmailValid,
  messages,
  normalizedEmail,
  onError,
  onLoggedIn,
  password,
  passwordReady,
  setIsSubmitting,
  trustDevice,
}: UseEmailLoginSignInActionsOptions) {
  const errorContext = { emailLoginMessages, messages };

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
    signInWithPasskey,
    signInWithPassword,
  };
}
