"use client";

import { useI18n } from "@/src/i18n/I18nProvider";
import {
  buildEmailLoginStepMeta,
} from "../model/account-email-login-step-meta";
import { buildEmailLoginPanelDerivedState } from "../model/email-login-panel-derived-state";
import { useEmailLoginChallengeState } from "./use-email-login-challenge-state";
import { useEmailLoginEntryActions } from "./use-email-login-entry-actions";
import { useEmailLoginFormState } from "./use-email-login-form-state";
import { useEmailLoginStepNavigation } from "./use-email-login-step-navigation";
import { useEmailLoginSubmitActions } from "../submit/use-email-login-submit-actions";
import type { UseEmailLoginPanelStateProps } from "./use-email-login-panel-state-params";
import { buildEmailLoginPanelStateResult } from "./email-login-panel-state-result";

export function useEmailLoginPanelState({
  accountClient,
  activeFlow,
  onError,
  onFlowChange,
  onLoggedIn,
}: UseEmailLoginPanelStateProps) {
  const { locale, t } = useI18n();
  const formState = useEmailLoginFormState();
  const stepNavigation = useEmailLoginStepNavigation();
  const challengeState = useEmailLoginChallengeState({
    setTransitionDirection: stepNavigation.setTransitionDirection,
  });
  const derivedState = buildEmailLoginPanelDerivedState({
    activeFlow,
    code: formState.code,
    email: formState.email,
    password: formState.password,
  });

  const submitActions = useEmailLoginSubmitActions({
    accountClient,
    activeFlow,
    authStep: stepNavigation.authStep,
    challenge: challengeState.challenge,
    code: formState.code,
    displayName: formState.displayName,
    emailLoginMessages: t.access.emailLogin,
    fallbackName: t.access.dashboard.fallbackName,
    isEmailValid: derivedState.isEmailValid,
    locale,
    messages: t.access.messages,
    normalizedEmail: derivedState.normalizedEmail,
    onError,
    onLoggedIn,
    otpReady: derivedState.otpReady,
    password: formState.password,
    passwordReady: derivedState.passwordReady,
    trustDevice: formState.trustDevice,
    verifiedRegistrationSession: challengeState.verifiedRegistrationSession,
    goToSetupStep: () => stepNavigation.goToStep("setup"),
    setChallenge: challengeState.setSubmittedChallenge,
    setVerifiedRegistrationSession: challengeState.setVerifiedRegistrationSession,
    startResendCooldown: challengeState.startResendCooldown,
    updateCode: formState.updateCode,
  });

  const entryActions = useEmailLoginEntryActions({
    activeFlow,
    clearCodeAndPassword: formState.clearCodeAndPassword,
    goToStep: stepNavigation.goToStep,
    onError,
    onFlowChange,
    resetEntryFields: formState.resetEntryFields,
    resetResendCooldown: challengeState.resetResendCooldown,
    setChallenge: challengeState.setChallenge,
    setPassword: formState.setPassword,
    setVerifiedRegistrationSession: challengeState.setVerifiedRegistrationSession,
  });

  const stepMeta = buildEmailLoginStepMeta({
    activeFlow,
    authStep: stepNavigation.authStep,
    challengeExpiresAt: challengeState.challenge?.expiresAt,
    locale,
    messages: t.access.emailLogin,
  });

  return buildEmailLoginPanelStateResult({
    activeFlow,
    challengeState,
    derivedState,
    emailLoginMessages: t.access.emailLogin,
    entryActions,
    formState,
    stepMeta,
    stepNavigation,
    submitActions,
  });
}

export type EmailLoginPanelState = ReturnType<typeof useEmailLoginPanelState>;
