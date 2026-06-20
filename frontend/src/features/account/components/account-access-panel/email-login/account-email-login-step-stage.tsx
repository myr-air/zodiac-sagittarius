"use client";

import type { ReactNode } from "react";
import type { Messages } from "@/src/i18n/messages";
import { cn } from "@/src/lib/cn";
import type { IconName } from "@/src/ui/icons";
import type { AuthFlow } from "../auth";
import { PanelHeading } from "../portal/account-portal-primitives";
import {
  accountStepStageClassName,
  accountStepStageDirectionClassNames,
} from "./account-email-login-styles";
import type { EmailLoginAuthStep, EmailLoginVisualStep } from "./account-email-login-step-meta";
import type { AuthTransitionDirection } from "./use-email-login-step-navigation";
import { EmailLoginStepContent } from "./account-email-login-step-dispatch";

interface EmailLoginStepStageProps {
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
  stepHeading: {
    detail: string;
    icon: IconName;
    title: string;
  };
  transitionDirection: AuthTransitionDirection;
  trustDeviceFields: ReactNode;
  visualStep: EmailLoginVisualStep;
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
