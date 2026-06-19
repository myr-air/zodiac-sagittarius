"use client";

import type { ReactNode } from "react";
import type { AuthFlow } from "../account-auth-chrome";
import { AccountField, AccountStepSummary } from "./account-email-login-fields";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";

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
