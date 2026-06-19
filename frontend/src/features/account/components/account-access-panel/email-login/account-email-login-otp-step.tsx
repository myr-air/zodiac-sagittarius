"use client";

import type { ReactNode } from "react";
import type { AuthFlow } from "../account-auth-chrome";
import { AccountField, AccountStepSummary } from "./account-email-login-fields";
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
