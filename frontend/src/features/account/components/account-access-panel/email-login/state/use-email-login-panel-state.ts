"use client";

import { useI18n } from "@/src/i18n/I18nProvider";
import {
  buildEmailLoginStepMeta,
} from "../account-email-login-step-meta";
import { buildEmailLoginPanelDerivedState } from "./email-login-panel-derived-state";
import { useEmailLoginChallengeState } from "./use-email-login-challenge-state";
import { useEmailLoginEntryActions } from "./use-email-login-entry-actions";
import { useEmailLoginFormState } from "./use-email-login-form-state";
import { useEmailLoginStepNavigation } from "./use-email-login-step-navigation";
import { useEmailLoginSubmitActions } from "../submit/use-email-login-submit-actions";
import type { UseEmailLoginPanelStateProps } from "./use-email-login-panel-state-params";

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
  const {
    challenge,
    resendCooldown,
    resetResendCooldown,
    setChallenge,
    setSubmittedChallenge,
    setVerifiedRegistrationSession,
    startResendCooldown,
    verifiedRegistrationSession,
  } = useEmailLoginChallengeState({ setTransitionDirection });
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
    setChallenge: setSubmittedChallenge,
    setVerifiedRegistrationSession,
    startResendCooldown,
    updateCode,
  });

  const {
    changeEmail,
    chooseMethods,
    resetChallenge,
    showPasswordStep,
    switchFlow,
  } = useEmailLoginEntryActions({
    activeFlow,
    clearCodeAndPassword,
    goToStep,
    onError,
    onFlowChange,
    resetEntryFields,
    resetResendCooldown,
    setChallenge,
    setPassword,
    setVerifiedRegistrationSession,
  });

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

export type EmailLoginPanelState = ReturnType<typeof useEmailLoginPanelState>;
