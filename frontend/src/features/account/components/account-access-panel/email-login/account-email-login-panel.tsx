"use client";

import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import { cn } from "@/src/lib/cn";
import { AccountAuthFlowSwitch, AccountAuthRouteTabs, type AuthFlow } from "../auth";
import {
  accountEntryLoginFlowClassName,
  accountLoginFlowClassName,
  accountStepKickerClassName,
} from "./account-email-login-styles";
import { AccountTrustDeviceField } from "./account-email-login-fields";
import { EmailLoginStepStage } from "./account-email-login-step-stage";
import { StatusMessage } from "../auth";
import { useEmailLoginPanelState } from "./state/use-email-login-panel-state";

interface EmailLoginPanelProps {
  accountClient: AccountApiClient;
  authCardClassName: string;
  flow: AuthFlow;
  formError?: string | null;
  onError: (message: string | null) => void;
  onFlowChange?: (flow: AuthFlow) => void;
  onLoggedIn: (session: AccountSession) => void;
  showRouteTabs?: boolean;
}

export function EmailLoginPanel({
  flow,
  accountClient,
  authCardClassName,
  formError,
  onError,
  onFlowChange,
  onLoggedIn,
  showRouteTabs = false,
}: EmailLoginPanelProps) {
  const {
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
    emailLoginMessages,
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
    stepHeading,
    stepLabel,
    transitionDirection,
    trustDevice,
    visualStep,
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
  } = useEmailLoginPanelState({
    accountClient,
    activeFlow: flow,
    onError,
    onFlowChange,
    onLoggedIn,
  });

  const trustDeviceFields = (
    <AccountTrustDeviceField checked={trustDevice} label={emailLoginMessages.trustDevice} onChange={setTrustDevice} />
  );

  return (
    <div className={cn(accountLoginFlowClassName, showRouteTabs ? accountEntryLoginFlowClassName : "")}>
      {showRouteTabs ? (
        <AccountAuthRouteTabs activeFlow={activeFlow} onFlowChange={switchFlow} />
      ) : null}
      <form
        aria-busy={isSubmitting}
        aria-describedby={formError ? formErrorId : undefined}
        className={authCardClassName}
        onSubmit={submitForm}
      >
        <span className={accountStepKickerClassName}>{stepLabel}</span>
        {formError ? <StatusMessage id={formErrorId} tone="danger">{formError}</StatusMessage> : null}
        <EmailLoginStepStage
          activeFlow={activeFlow}
          authStep={authStep}
          code={code}
          codeHintId={codeHintId}
          codeInputId={codeInputId}
          displayName={displayName}
          email={email}
          emailHintId={emailHintId}
          emailInputId={emailInputId}
          emailLoginMessages={emailLoginMessages}
          hasChallenge={Boolean(challenge)}
          homeBase={homeBase}
          isEmailInvalid={isEmailInvalid}
          isEmailValid={isEmailValid}
          isPasswordInvalid={isPasswordInvalid}
          isSubmitting={isSubmitting}
          normalizedEmail={normalizedEmail}
          otpReady={otpReady}
          password={password}
          passwordAutocomplete={passwordAutocomplete}
          passwordHintId={passwordHintId}
          passwordInputId={passwordInputId}
          passwordReady={passwordReady}
          resendCooldown={resendCooldown}
          stepHeading={stepHeading}
          transitionDirection={transitionDirection}
          trustDeviceFields={trustDeviceFields}
          visualStep={visualStep}
          changeEmail={changeEmail}
          chooseMethods={chooseMethods}
          requestEmailCode={requestEmailCode}
          resetChallenge={resetChallenge}
          setDisplayName={setDisplayName}
          setEmail={setEmail}
          setHomeBase={setHomeBase}
          setPassword={setPassword}
          showPasswordStep={showPasswordStep}
          signInWithPasskey={signInWithPasskey}
          updateCode={updateCode}
        />
      </form>
      {!challenge ? (
        <AccountAuthFlowSwitch activeFlow={activeFlow} onFlowChange={switchFlow} />
      ) : null}
    </div>
  );
}
