"use client";

import type { ReactNode } from "react";
import type { AuthFlow } from "../../auth";
import { AccountField, AccountTertiaryAction } from "../account-email-login-fields";
import { accountAlternateActionsClassName } from "../account-email-login-styles";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";

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
