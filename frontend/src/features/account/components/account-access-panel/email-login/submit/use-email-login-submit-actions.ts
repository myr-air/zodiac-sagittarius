"use client";

import { type FormEvent, useState } from "react";
import { selectEmailLoginSubmitHandler } from "./email-login-submit-route";
import type { UseEmailLoginSubmitActionsProps } from "./use-email-login-submit-actions-params";
import { useEmailLoginCodeRequestActions } from "./use-email-login-code-request-actions";
import { useEmailLoginRegistrationActions } from "./use-email-login-registration-actions";
import { useEmailLoginSignInActions } from "./use-email-login-sign-in-actions";

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
  const {
    requestEmailCode,
  } = useEmailLoginCodeRequestActions({
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
  });
  const {
    signInWithPasskey,
    signInWithPassword,
  } = useEmailLoginSignInActions({
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
  });
  const {
    submitCode,
    submitSetup,
  } = useEmailLoginRegistrationActions({
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
  });

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
