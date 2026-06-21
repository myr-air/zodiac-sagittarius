"use client";

import { cn } from "@/src/lib/cn";
import { PanelHeading } from "../primitives/account-panel-heading";
import {
  accountStepStageClassName,
  accountStepStageDirectionClassNames,
} from "./account-email-login-styles";
import { EmailLoginStepContent } from "./account-email-login-step-dispatch";
import type { EmailLoginStepStageProps } from "./account-email-login-step.types";

export function EmailLoginStepStage({
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
  stepHeading,
  transitionDirection,
  trustDeviceFields,
  visualStep,
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
}: EmailLoginStepStageProps) {
  return (
    <div className={cn(accountStepStageClassName, accountStepStageDirectionClassNames[transitionDirection])} key={visualStep}>
      <PanelHeading
        icon={stepHeading.icon}
        title={stepHeading.title}
        detail={stepHeading.detail}
      />
      <EmailLoginStepContent
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
        hasChallenge={hasChallenge}
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
        trustDeviceFields={trustDeviceFields}
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
    </div>
  );
}
