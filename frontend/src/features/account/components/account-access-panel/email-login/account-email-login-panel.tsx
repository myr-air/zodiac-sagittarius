"use client";

import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import { cn } from "@/src/lib/cn";
import { AccountAuthFlowSwitch, AccountAuthRouteTabs, type AuthFlow } from "../auth";
import {
  accountEntryLoginFlowClassName,
  accountLoginFlowClassName,
  accountStepKickerClassName,
  accountStepStageClassName,
  accountStepStageDirectionClassNames,
} from "./account-email-login-styles";
import { AccountTrustDeviceField } from "./account-email-login-fields";
import {
  EmailLoginCredentialsStep,
  EmailLoginMethodsStep,
  EmailLoginOtpStep,
  EmailLoginPasswordStep,
  EmailLoginSetupStep,
} from "./account-email-login-step-content";
import { PanelHeading } from "../portal/account-portal-primitives";
import { StatusMessage } from "../auth";
import { useEmailLoginPanelState } from "./use-email-login-panel-state";

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
        <div className={cn(accountStepStageClassName, accountStepStageDirectionClassNames[transitionDirection])} key={visualStep}>
          <PanelHeading
            icon={stepHeading.icon}
            title={stepHeading.title}
            detail={stepHeading.detail}
          />
          {challenge ? (
            <EmailLoginOtpStep
              activeFlow={activeFlow}
              code={code}
              codeHintId={codeHintId}
              codeInputId={codeInputId}
              disabledResend={!isEmailValid || (activeFlow === "register" && !passwordReady) || isSubmitting || resendCooldown > 0}
              isSubmitting={isSubmitting}
              labels={{
                changeEmail: emailLoginMessages.changeEmail,
                resendCode: emailLoginMessages.resendCode,
                resendCooldown: (seconds) => emailLoginMessages.resendCooldown({ seconds }),
                sentCodeTo: emailLoginMessages.sentCodeTo,
                signInAccount: emailLoginMessages.signInAccount,
                verificationCode: emailLoginMessages.verificationCode,
                verificationCodeHint: emailLoginMessages.verificationCodeHint,
                verifyEmail: emailLoginMessages.verifyEmail,
              }}
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
              labels={{
                alternateSignInOptions: emailLoginMessages.alternateSignInOptions,
                createWithPassword: emailLoginMessages.createWithPassword,
                email: emailLoginMessages.email,
                password: emailLoginMessages.password,
                passwordHint: emailLoginMessages.passwordHint,
                signInAccount: emailLoginMessages.signInAccount,
                usePasskeyInstead: emailLoginMessages.usePasskeyInstead,
                useSignInCodeInstead: emailLoginMessages.useSignInCodeInstead,
              }}
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
              labels={{
                changeEmail: emailLoginMessages.changeEmail,
                createFor: emailLoginMessages.createFor,
                createWithPassword: emailLoginMessages.createWithPassword,
                sendRegisterCode: emailLoginMessages.sendRegisterCode,
                sendSignInCode: emailLoginMessages.sendSignInCode,
                signInAs: emailLoginMessages.signInAs,
                signInWithPasskey: emailLoginMessages.signInWithPasskey,
                signInWithPassword: emailLoginMessages.signInWithPassword,
              }}
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
              labels={{
                createFor: emailLoginMessages.createFor,
                displayName: emailLoginMessages.displayName,
                finishSetup: emailLoginMessages.finishSetup,
                homeBase: emailLoginMessages.homeBase,
              }}
              normalizedEmail={normalizedEmail}
              onDisplayNameChange={setDisplayName}
              onHomeBaseChange={setHomeBase}
            />
          ) : (
            <EmailLoginPasswordStep
              activeFlow={activeFlow}
              isPasswordInvalid={isPasswordInvalid}
              isSubmitting={isSubmitting}
              labels={{
                changeEmail: emailLoginMessages.changeEmail,
                chooseAnotherMethod: emailLoginMessages.chooseAnotherMethod,
                continueToOtp: emailLoginMessages.continueToOtp,
                createFor: emailLoginMessages.createFor,
                password: emailLoginMessages.password,
                passwordHint: emailLoginMessages.passwordHint,
                signInAs: emailLoginMessages.signInAs,
                signInWithPassword: emailLoginMessages.signInWithPassword,
              }}
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
      </form>
      {!challenge ? (
        <AccountAuthFlowSwitch activeFlow={activeFlow} onFlowChange={switchFlow} />
      ) : null}
    </div>
  );
}
