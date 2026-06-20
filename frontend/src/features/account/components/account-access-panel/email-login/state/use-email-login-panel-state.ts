"use client";

import { useState } from "react";
import type { AccountApiClient, AccountSession, EmailLoginStartResponse } from "@/src/account/api-client";
import { useI18n } from "@/src/i18n/I18nProvider";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import type { AuthFlow } from "../../auth";
import {
  buildEmailLoginStepMeta,
} from "../account-email-login-step-meta";
import { buildEmailLoginPanelDerivedState } from "./email-login-panel-derived-state";
import { useEmailLoginFormState } from "./use-email-login-form-state";
import { useEmailLoginResendCooldown } from "./use-email-login-resend-cooldown";
import { useEmailLoginStepNavigation, type AuthTransitionDirection } from "./use-email-login-step-navigation";
import { useEmailLoginSubmitActions } from "../submit/use-email-login-submit-actions";

interface UseEmailLoginPanelStateProps {
  accountClient: AccountApiClient;
  activeFlow: AuthFlow;
  onError: (message: string | null) => void;
  onFlowChange?: (flow: AuthFlow) => void;
  onLoggedIn: (session: AccountSession) => void;
}

export function useEmailLoginPanelState({
  accountClient,
  activeFlow,
  onError,
  onFlowChange,
  onLoggedIn,
}: UseEmailLoginPanelStateProps) {
  const { locale, t } = useI18n();
  const {
    code,
    displayName,
    email,
    homeBase,
    password,
    trustDevice,
    clearCodeAndPassword,
    resetEntryFields,
    setDisplayName,
    setEmail,
    setHomeBase,
    setPassword,
    setTrustDevice,
    updateCode,
  } = useEmailLoginFormState();
  const {
    authStep,
    goToStep,
    setTransitionDirection,
    transitionDirection,
  } = useEmailLoginStepNavigation();
  const [challenge, setChallenge] = useState<EmailLoginStartResponse | null>(null);
  const [verifiedRegistrationSession, setVerifiedRegistrationSession] = useState<AccountSession | null>(null);
  const {
    resendCooldown,
    resetResendCooldown,
    startResendCooldown,
  } = useEmailLoginResendCooldown(challenge);
  const {
    codeHintId,
    codeInputId,
    emailHintId,
    emailInputId,
    formErrorId,
    isEmailInvalid,
    isEmailValid,
    isPasswordInvalid,
    normalizedEmail,
    otpReady,
    passwordAutocomplete,
    passwordHintId,
    passwordInputId,
    passwordReady,
  } = buildEmailLoginPanelDerivedState({
    activeFlow,
    code,
    email,
    password,
  });

  function resetChallenge() {
    setChallenge(null);
    clearCodeAndPassword();
    resetResendCooldown();
    goToStep("email", "back");
    onError(null);
  }

  function changeEmail() {
    resetEntryState("back");
  }

  function resetEntryState(direction: AuthTransitionDirection = "back") {
    setChallenge(null);
    resetEntryFields();
    resetResendCooldown();
    setVerifiedRegistrationSession(null);
    goToStep("email", direction);
    onError(null);
  }

  function showPasswordStep() {
    setPassword("");
    goToStep("password");
    onError(null);
  }

  function chooseMethods() {
    goToStep("methods", "back");
    onError(null);
  }

  const {
    isSubmitting,
    requestEmailCode,
    signInWithPasskey,
    submitForm,
  } = useEmailLoginSubmitActions({
    accountClient,
    activeFlow,
    authStep,
    challenge,
    code,
    displayName,
    emailLoginMessages: t.access.emailLogin,
    fallbackName: t.access.dashboard.fallbackName,
    isEmailValid,
    locale,
    messages: t.access.messages,
    normalizedEmail,
    onError,
    onLoggedIn,
    otpReady,
    password,
    passwordReady,
    trustDevice,
    verifiedRegistrationSession,
    goToSetupStep: () => goToStep("setup"),
    setChallenge: (nextChallenge) => {
      if (nextChallenge) setTransitionDirection("forward");
      setChallenge(nextChallenge);
    },
    setVerifiedRegistrationSession,
    startResendCooldown,
    updateCode,
  });

  function switchFlow(nextFlow: AuthFlow) {
    if (nextFlow === activeFlow) return;
    onFlowChange?.(nextFlow);
    resetEntryState("mode");
    const nextHref = nextFlow === "register" ? appRoutes.register() : appRoutes.login();
    window.history.replaceState(null, "", nextHref);
  }

  const stepMeta = buildEmailLoginStepMeta({
    activeFlow,
    authStep,
    challengeExpiresAt: challenge?.expiresAt,
    locale,
    messages: t.access.emailLogin,
  });

  return {
    activeFlow,
    authStep,
    challenge,
    code,
    codeHintId,
    codeInputId,
    displayName,
    email,
    emailHintId,
    emailInputId,
    emailLoginMessages: t.access.emailLogin,
    formErrorId,
    homeBase,
    isEmailInvalid,
    isEmailValid,
    isPasswordInvalid,
    isSubmitting,
    normalizedEmail,
    otpReady,
    password,
    passwordAutocomplete,
    passwordHintId,
    passwordInputId,
    passwordReady,
    resendCooldown,
    stepHeading: stepMeta.heading,
    stepLabel: stepMeta.label,
    transitionDirection,
    trustDevice,
    visualStep: stepMeta.visualStep,
    changeEmail,
    chooseMethods,
    requestEmailCode,
    resetChallenge,
    setDisplayName,
    setEmail,
    setHomeBase,
    setPassword,
    setTrustDevice,
    showPasswordStep,
    signInWithPasskey,
    submitForm,
    switchFlow,
    updateCode,
  };
}
