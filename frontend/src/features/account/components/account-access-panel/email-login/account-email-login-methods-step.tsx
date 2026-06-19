"use client";

import type { AuthFlow } from "../auth";
import { AccountStepSummary } from "./account-email-login-fields";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";

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
