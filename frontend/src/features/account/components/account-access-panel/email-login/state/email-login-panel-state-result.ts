import type { Messages } from "@/src/i18n/messages";
import type { AuthFlow } from "../../auth";
import type { EmailLoginPanelDerivedState } from "../model/email-login-panel-derived-state";
import type { buildEmailLoginStepMeta } from "../model/account-email-login-step-meta";
import type { useEmailLoginSubmitActions } from "../submit/use-email-login-submit-actions";
import type { useEmailLoginChallengeState } from "./use-email-login-challenge-state";
import type { useEmailLoginEntryActions } from "./use-email-login-entry-actions";
import type { useEmailLoginFormState } from "./use-email-login-form-state";
import type { useEmailLoginStepNavigation } from "./use-email-login-step-navigation";

interface BuildEmailLoginPanelStateResultInput {
  activeFlow: AuthFlow;
  challengeState: Pick<
    ReturnType<typeof useEmailLoginChallengeState>,
    "challenge" | "resendCooldown"
  >;
  derivedState: EmailLoginPanelDerivedState;
  emailLoginMessages: Messages["access"]["emailLogin"];
  entryActions: ReturnType<typeof useEmailLoginEntryActions>;
  formState: ReturnType<typeof useEmailLoginFormState>;
  stepMeta: ReturnType<typeof buildEmailLoginStepMeta>;
  stepNavigation: Pick<
    ReturnType<typeof useEmailLoginStepNavigation>,
    "authStep" | "transitionDirection"
  >;
  submitActions: ReturnType<typeof useEmailLoginSubmitActions>;
}

export function buildEmailLoginPanelStateResult({
  activeFlow,
  challengeState,
  derivedState,
  emailLoginMessages,
  entryActions,
  formState,
  stepMeta,
  stepNavigation,
  submitActions,
}: BuildEmailLoginPanelStateResultInput) {
  return {
    activeFlow,
    authStep: stepNavigation.authStep,
    challenge: challengeState.challenge,
    code: formState.code,
    codeHintId: derivedState.codeHintId,
    codeInputId: derivedState.codeInputId,
    displayName: formState.displayName,
    email: formState.email,
    emailHintId: derivedState.emailHintId,
    emailInputId: derivedState.emailInputId,
    emailLoginMessages,
    formErrorId: derivedState.formErrorId,
    homeBase: formState.homeBase,
    isEmailInvalid: derivedState.isEmailInvalid,
    isEmailValid: derivedState.isEmailValid,
    isPasswordInvalid: derivedState.isPasswordInvalid,
    isSubmitting: submitActions.isSubmitting,
    normalizedEmail: derivedState.normalizedEmail,
    otpReady: derivedState.otpReady,
    password: formState.password,
    passwordAutocomplete: derivedState.passwordAutocomplete,
    passwordHintId: derivedState.passwordHintId,
    passwordInputId: derivedState.passwordInputId,
    passwordReady: derivedState.passwordReady,
    resendCooldown: challengeState.resendCooldown,
    stepHeading: stepMeta.heading,
    stepLabel: stepMeta.label,
    transitionDirection: stepNavigation.transitionDirection,
    trustDevice: formState.trustDevice,
    visualStep: stepMeta.visualStep,
    changeEmail: entryActions.changeEmail,
    chooseMethods: entryActions.chooseMethods,
    requestEmailCode: submitActions.requestEmailCode,
    resetChallenge: entryActions.resetChallenge,
    setDisplayName: formState.setDisplayName,
    setEmail: formState.setEmail,
    setHomeBase: formState.setHomeBase,
    setPassword: formState.setPassword,
    setTrustDevice: formState.setTrustDevice,
    showPasswordStep: entryActions.showPasswordStep,
    signInWithPasskey: submitActions.signInWithPasskey,
    submitForm: submitActions.submitForm,
    switchFlow: entryActions.switchFlow,
    updateCode: formState.updateCode,
  };
}

export type EmailLoginPanelStateResult = ReturnType<
  typeof buildEmailLoginPanelStateResult
>;
