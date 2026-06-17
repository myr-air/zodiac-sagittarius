"use client";

import type { ReactNode } from "react";
import type { AuthFlow } from "./account-auth-chrome";
import { AccountField, AccountStepSummary, AccountTertiaryAction } from "./account-email-login-fields";
import { accountAlternateActionsClassName } from "./account-email-login-styles";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";

interface EmailLoginOtpStepProps {
  activeFlow: AuthFlow;
  code: string;
  codeHintId: string;
  codeInputId: string;
  disabledResend: boolean;
  isSubmitting: boolean;
  normalizedEmail: string;
  otpReady: boolean;
  resendCooldown: number;
  trustDeviceFields: ReactNode;
  labels: {
    changeEmail: string;
    resendCode: string;
    resendCooldown: (seconds: number) => string;
    sentCodeTo: string;
    signInAccount: string;
    verificationCode: string;
    verificationCodeHint: string;
    verifyEmail: string;
  };
  onChangeCode: (value: string) => void;
  onRequestEmailCode: () => void;
  onResetChallenge: () => void;
}

export function EmailLoginOtpStep({
  activeFlow,
  code,
  codeHintId,
  codeInputId,
  disabledResend,
  isSubmitting,
  labels,
  normalizedEmail,
  onChangeCode,
  onRequestEmailCode,
  onResetChallenge,
  otpReady,
  resendCooldown,
  trustDeviceFields,
}: EmailLoginOtpStepProps) {
  return (
    <>
      <AccountStepSummary label={labels.sentCodeTo} value={normalizedEmail} />
      <AccountField inputId={codeInputId} label={labels.verificationCode} hintId={codeHintId} hint={labels.verificationCodeHint}>
        <input
          id={codeInputId}
          value={code}
          onChange={(event) => onChangeCode(event.target.value)}
          name="one-time-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          aria-describedby={codeHintId}
          aria-invalid={code.length > 0 && !otpReady ? true : undefined}
          required
          suppressHydrationWarning
        />
      </AccountField>
      {activeFlow === "login" ? trustDeviceFields : null}
      <Button type="submit" disabled={!otpReady || isSubmitting}>
        <Icon name="check" />
        {activeFlow === "register" ? labels.verifyEmail : labels.signInAccount}
      </Button>
      <Button type="button" variant="secondary" disabled={disabledResend} onClick={onRequestEmailCode}>
        {labels.resendCode}
        {resendCooldown > 0 ? labels.resendCooldown(resendCooldown) : ""}
      </Button>
      <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onResetChallenge}>
        {labels.changeEmail}
      </Button>
    </>
  );
}

interface EmailLoginCredentialsStepProps {
  activeFlow: AuthFlow;
  disabledAlternateActions: boolean;
  disabledPrimary: boolean;
  email: string;
  emailHint: string;
  emailHintId: string;
  emailInputId: string;
  isEmailInvalid: boolean;
  isPasswordInvalid: boolean;
  password: string;
  passwordAutocomplete: string;
  passwordHintId: string;
  passwordInputId: string;
  trustDeviceFields: ReactNode;
  labels: {
    alternateSignInOptions: string;
    createWithPassword: string;
    email: string;
    password: string;
    passwordHint: string;
    signInAccount: string;
    usePasskeyInstead: string;
    useSignInCodeInstead: string;
  };
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRequestEmailCode: () => void;
  onSignInWithPasskey: () => void;
}

export function EmailLoginCredentialsStep({
  activeFlow,
  disabledAlternateActions,
  disabledPrimary,
  email,
  emailHint,
  emailHintId,
  emailInputId,
  isEmailInvalid,
  isPasswordInvalid,
  labels,
  onEmailChange,
  onPasswordChange,
  onRequestEmailCode,
  onSignInWithPasskey,
  password,
  passwordAutocomplete,
  passwordHintId,
  passwordInputId,
  trustDeviceFields,
}: EmailLoginCredentialsStepProps) {
  return (
    <>
      <AccountField inputId={emailInputId} label={labels.email} hintId={emailHintId} hint={emailHint}>
        <input
          id={emailInputId}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="username"
          aria-describedby={emailHintId}
          aria-invalid={isEmailInvalid ? true : undefined}
          spellCheck={false}
          placeholder="you@example.com"
          required
          suppressHydrationWarning
        />
      </AccountField>
      <AccountField inputId={passwordInputId} label={labels.password} hintId={passwordHintId} hint={labels.passwordHint}>
        <input
          id={passwordInputId}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          name="password"
          type="password"
          autoComplete={passwordAutocomplete}
          aria-describedby={passwordHintId}
          aria-invalid={isPasswordInvalid ? true : undefined}
          minLength={8}
          required
          suppressHydrationWarning
        />
      </AccountField>
      {activeFlow === "login" ? trustDeviceFields : null}
      <Button type="submit" disabled={disabledPrimary}>
        <Icon name={activeFlow === "register" ? "check" : "key"} />
        {activeFlow === "register" ? labels.createWithPassword : labels.signInAccount}
      </Button>
      {activeFlow === "login" ? (
        <div className={accountAlternateActionsClassName} aria-label={labels.alternateSignInOptions}>
          <AccountTertiaryAction icon="check" label={labels.useSignInCodeInstead} disabled={disabledAlternateActions} onClick={onRequestEmailCode} />
          <AccountTertiaryAction icon="key" label={labels.usePasskeyInstead} disabled={disabledAlternateActions} onClick={onSignInWithPasskey} />
        </div>
      ) : null}
    </>
  );
}

interface EmailLoginMethodsStepProps {
  activeFlow: AuthFlow;
  isSubmitting: boolean;
  normalizedEmail: string;
  labels: {
    changeEmail: string;
    createFor: string;
    createWithPassword: string;
    sendRegisterCode: string;
    sendSignInCode: string;
    signInAs: string;
    signInWithPasskey: string;
    signInWithPassword: string;
  };
  onChangeEmail: () => void;
  onRequestEmailCode: () => void;
  onShowPasswordStep: () => void;
  onSignInWithPasskey: () => void;
}

export function EmailLoginMethodsStep({
  activeFlow,
  isSubmitting,
  labels,
  normalizedEmail,
  onChangeEmail,
  onRequestEmailCode,
  onShowPasswordStep,
  onSignInWithPasskey,
}: EmailLoginMethodsStepProps) {
  return (
    <>
      <AccountStepSummary label={activeFlow === "register" ? labels.createFor : labels.signInAs} value={normalizedEmail} />
      <Button type="button" disabled={isSubmitting} onClick={onRequestEmailCode}>
        <Icon name="check" />
        {activeFlow === "register" ? labels.sendRegisterCode : labels.sendSignInCode}
      </Button>
      <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onShowPasswordStep}>
        <Icon name="key" />
        {activeFlow === "register" ? labels.createWithPassword : labels.signInWithPassword}
      </Button>
      {activeFlow === "login" ? (
        <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onSignInWithPasskey}>
          <Icon name="key" />
          {labels.signInWithPasskey}
        </Button>
      ) : null}
      <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onChangeEmail}>
        {labels.changeEmail}
      </Button>
    </>
  );
}

interface EmailLoginSetupStepProps {
  displayName: string;
  homeBase: string;
  isSubmitting: boolean;
  normalizedEmail: string;
  labels: {
    createFor: string;
    displayName: string;
    finishSetup: string;
    homeBase: string;
  };
  onDisplayNameChange: (value: string) => void;
  onHomeBaseChange: (value: string) => void;
}

export function EmailLoginSetupStep({
  displayName,
  homeBase,
  isSubmitting,
  labels,
  normalizedEmail,
  onDisplayNameChange,
  onHomeBaseChange,
}: EmailLoginSetupStepProps) {
  return (
    <>
      <AccountStepSummary label={labels.createFor} value={normalizedEmail} />
      <label>
        <span>{labels.displayName}</span>
        <input value={displayName} onChange={(event) => onDisplayNameChange(event.target.value)} autoComplete="name" placeholder="Aom Traveler" required suppressHydrationWarning />
      </label>
      <label>
        <span>{labels.homeBase}</span>
        <input value={homeBase} onChange={(event) => onHomeBaseChange(event.target.value)} autoComplete="address-level2" placeholder="Bangkok" suppressHydrationWarning />
      </label>
      <Button type="submit" disabled={!displayName.trim() || isSubmitting}>
        <Icon name="check" />
        {labels.finishSetup}
      </Button>
    </>
  );
}

interface EmailLoginPasswordStepProps {
  activeFlow: AuthFlow;
  isPasswordInvalid: boolean;
  isSubmitting: boolean;
  normalizedEmail: string;
  password: string;
  passwordAutocomplete: string;
  passwordHintId: string;
  passwordInputId: string;
  trustDeviceFields: ReactNode;
  labels: {
    changeEmail: string;
    chooseAnotherMethod: string;
    continueToOtp: string;
    createFor: string;
    password: string;
    passwordHint: string;
    signInAs: string;
    signInWithPassword: string;
  };
  onChangeEmail: () => void;
  onChooseMethods: () => void;
  onPasswordChange: (value: string) => void;
}

export function EmailLoginPasswordStep({
  activeFlow,
  isPasswordInvalid,
  isSubmitting,
  labels,
  normalizedEmail,
  onChangeEmail,
  onChooseMethods,
  onPasswordChange,
  password,
  passwordAutocomplete,
  passwordHintId,
  passwordInputId,
  trustDeviceFields,
}: EmailLoginPasswordStepProps) {
  const passwordStepInputId = `${passwordInputId}-step`;

  return (
    <>
      <AccountStepSummary label={activeFlow === "register" ? labels.createFor : labels.signInAs} value={normalizedEmail} />
      <input
        aria-hidden="true"
        autoComplete="username"
        className="sr-only"
        name="email"
        readOnly
        tabIndex={-1}
        type="email"
        value={normalizedEmail}
      />
      <AccountField inputId={passwordStepInputId} label={labels.password} hintId={passwordHintId} hint={labels.passwordHint}>
        <input
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          id={passwordStepInputId}
          name="password"
          type="password"
          autoComplete={passwordAutocomplete}
          aria-describedby={passwordHintId}
          aria-invalid={isPasswordInvalid ? true : undefined}
          minLength={8}
          required
          suppressHydrationWarning
        />
      </AccountField>
      {activeFlow === "login" ? trustDeviceFields : null}
      <Button type="submit" disabled={password.length < 8 || isSubmitting}>
        <Icon name="key" />
        {activeFlow === "register" ? labels.continueToOtp : labels.signInWithPassword}
      </Button>
      {activeFlow === "login" ? (
        <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onChooseMethods}>
          {labels.chooseAnotherMethod}
        </Button>
      ) : (
        <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onChangeEmail}>
          {labels.changeEmail}
        </Button>
      )}
    </>
  );
}
