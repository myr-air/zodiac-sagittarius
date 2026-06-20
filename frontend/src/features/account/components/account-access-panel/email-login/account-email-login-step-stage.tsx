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
      {hasChallenge ? (
        <EmailLoginOtpStep
          activeFlow={activeFlow}
          code={code}
          codeHintId={codeHintId}
          codeInputId={codeInputId}
          disabledResend={!isEmailValid || (activeFlow === "register" && !passwordReady) || isSubmitting || resendCooldown > 0}
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
      ) : authStep === "email" ? (
        <EmailLoginCredentialsStep
          activeFlow={activeFlow}
          disabledAlternateActions={!isEmailValid || isSubmitting}
          disabledPrimary={!isEmailValid || !passwordReady || isSubmitting}
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
      ) : authStep === "methods" ? (
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
      ) : authStep === "setup" ? (
        <EmailLoginSetupStep
          displayName={displayName}
          homeBase={homeBase}
          isSubmitting={isSubmitting}
          labels={emailLoginSetupLabels(emailLoginMessages)}
          normalizedEmail={normalizedEmail}
          onDisplayNameChange={setDisplayName}
          onHomeBaseChange={setHomeBase}
        />
      ) : (
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
      )}
    </div>
  );
}
