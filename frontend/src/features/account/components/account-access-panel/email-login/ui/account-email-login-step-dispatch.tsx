"use client";

import {
  emailLoginCredentialsLabels,
  emailLoginMethodsLabels,
  emailLoginOtpLabels,
  emailLoginPasswordLabels,
  emailLoginSetupLabels,
} from "../model/account-email-login-step-labels";
import {
  EmailLoginCredentialsStep,
} from "../steps/account-email-login-credentials-step";
import { EmailLoginMethodsStep } from "../steps/account-email-login-methods-step";
import { EmailLoginOtpStep } from "../steps/account-email-login-otp-step";
import { EmailLoginPasswordStep } from "../steps/account-email-login-password-step";
import { EmailLoginSetupStep } from "../steps/account-email-login-setup-step";
import type { EmailLoginStepContentProps } from "./account-email-login-step.types";
import { buildEmailLoginStepDisabledState } from "../model/email-login-step-disabled-state";

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
