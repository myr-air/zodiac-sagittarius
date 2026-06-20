"use client";

import type { ReactNode } from "react";
import type { Messages } from "@/src/i18n/messages";
import type { AuthFlow } from "../auth";
import type { EmailLoginAuthStep } from "./account-email-login-step-meta";
import {
  emailLoginCredentialsLabels,
  emailLoginMethodsLabels,
  emailLoginOtpLabels,
  emailLoginPasswordLabels,
  emailLoginSetupLabels,
} from "./account-email-login-step-labels";
import {
  EmailLoginCredentialsStep,
  EmailLoginMethodsStep,
  EmailLoginOtpStep,
  EmailLoginPasswordStep,
  EmailLoginSetupStep,
} from "./account-email-login-step-content";
import { buildEmailLoginStepDisabledState } from "./email-login-step-disabled-state";

export interface EmailLoginStepContentProps {
  activeFlow: AuthFlow;
  authStep: EmailLoginAuthStep;
  code: string;
  codeHintId: string;
  codeInputId: string;
  displayName: string;
  email: string;
  emailHintId: string;
  emailInputId: string;
  emailLoginMessages: Messages["access"]["emailLogin"];
  hasChallenge: boolean;
  homeBase: string;
  isEmailInvalid: boolean;
  isEmailValid: boolean;
  isPasswordInvalid: boolean;
  isSubmitting: boolean;
  normalizedEmail: string;
  otpReady: boolean;
  password: string;
  passwordAutocomplete: string;
  passwordHintId: string;
  passwordInputId: string;
  passwordReady: boolean;
  resendCooldown: number;
  trustDeviceFields: ReactNode;
  changeEmail: () => void;
  chooseMethods: () => void;
  requestEmailCode: () => Promise<void>;
  resetChallenge: () => void;
  setDisplayName: (value: string) => void;
  setEmail: (value: string) => void;
  setHomeBase: (value: string) => void;
  setPassword: (value: string) => void;
  showPasswordStep: () => void;
  signInWithPasskey: () => Promise<void>;
  updateCode: (value: string) => void;
}

export function EmailLoginStepContent({
  activeFlow,
  authStep,
  code,
  codeHintId,
  codeInputId,
  displayName,
  email,
  emailHintId,
  emailInputId,
  emailLoginMessages,
  hasChallenge,
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
  trustDeviceFields,
  changeEmail,
  chooseMethods,
  requestEmailCode,
  resetChallenge,
  setDisplayName,
  setEmail,
  setHomeBase,
  setPassword,
  showPasswordStep,
  signInWithPasskey,
  updateCode,
}: EmailLoginStepContentProps) {
  const disabledState = buildEmailLoginStepDisabledState({
    activeFlow,
    isEmailValid,
    isSubmitting,
    passwordReady,
    resendCooldown,
  });

  if (hasChallenge) {
    return (
      <EmailLoginOtpStep
        activeFlow={activeFlow}
        code={code}
        codeHintId={codeHintId}
        codeInputId={codeInputId}
        disabledResend={disabledState.codeResend}
        isSubmitting={isSubmitting}
        labels={emailLoginOtpLabels(emailLoginMessages)}
        normalizedEmail={normalizedEmail}
        onChangeCode={updateCode}
        onRequestEmailCode={() => void requestEmailCode()}
        onResetChallenge={resetChallenge}
        otpReady={otpReady}
        resendCooldown={resendCooldown}
        trustDeviceFields={trustDeviceFields}
      />
    );
  }

  if (authStep === "email") {
    return (
      <EmailLoginCredentialsStep
        activeFlow={activeFlow}
        disabledAlternateActions={disabledState.alternateActions}
        disabledPrimary={disabledState.credentialsPrimary}
        email={email}
        emailHint={isEmailInvalid ? emailLoginMessages.emailInvalidHint : emailLoginMessages.emailHint}
        emailHintId={emailHintId}
        emailInputId={emailInputId}
        isEmailInvalid={isEmailInvalid}
        isPasswordInvalid={isPasswordInvalid}
        labels={emailLoginCredentialsLabels(emailLoginMessages)}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onRequestEmailCode={() => void requestEmailCode()}
        onSignInWithPasskey={() => void signInWithPasskey()}
        password={password}
        passwordAutocomplete={passwordAutocomplete}
        passwordHintId={passwordHintId}
        passwordInputId={passwordInputId}
        trustDeviceFields={trustDeviceFields}
      />
    );
  }

  if (authStep === "methods") {
    return (
      <EmailLoginMethodsStep
        activeFlow={activeFlow}
        isSubmitting={isSubmitting}
        labels={emailLoginMethodsLabels(emailLoginMessages)}
        normalizedEmail={normalizedEmail}
        onChangeEmail={changeEmail}
        onRequestEmailCode={() => void requestEmailCode()}
        onShowPasswordStep={showPasswordStep}
        onSignInWithPasskey={() => void signInWithPasskey()}
      />
    );
  }

  if (authStep === "setup") {
    return (
      <EmailLoginSetupStep
        displayName={displayName}
        homeBase={homeBase}
        isSubmitting={isSubmitting}
        labels={emailLoginSetupLabels(emailLoginMessages)}
        normalizedEmail={normalizedEmail}
        onDisplayNameChange={setDisplayName}
        onHomeBaseChange={setHomeBase}
      />
    );
  }

  return (
    <EmailLoginPasswordStep
      activeFlow={activeFlow}
      isPasswordInvalid={isPasswordInvalid}
      isSubmitting={isSubmitting}
      labels={emailLoginPasswordLabels(emailLoginMessages)}
      normalizedEmail={normalizedEmail}
      onChangeEmail={changeEmail}
      onChooseMethods={chooseMethods}
      onPasswordChange={setPassword}
      password={password}
      passwordAutocomplete={passwordAutocomplete}
      passwordHintId={passwordHintId}
      passwordInputId={passwordInputId}
      trustDeviceFields={trustDeviceFields}
    />
  );
}
