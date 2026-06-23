import { AccountAuthFlowSwitch, AccountAuthRouteTabs } from "../../auth";
import { cn } from "@/src/lib/cn";
import {
  accountEntryLoginFlowClassName,
  accountLoginFlowClassName,
  accountStepKickerClassName,
} from "./account-email-login-styles";
import { AccountTrustDeviceField } from "./account-email-login-fields";
import { EmailLoginStepStage } from "./account-email-login-step-stage";
import { StatusMessage } from "../../auth";
import type { EmailLoginPanelState } from "../state/use-email-login-panel-state";

interface EmailLoginPanelFormProps {
  authCardClassName: string;
  formError?: string | null;
  showRouteTabs: boolean;
  state: EmailLoginPanelState;
}

export function EmailLoginPanelForm({
  authCardClassName,
  formError,
  showRouteTabs,
  state,
}: EmailLoginPanelFormProps) {
  const trustDeviceFields = (
    <AccountTrustDeviceField
      checked={state.trustDevice}
      label={state.emailLoginMessages.trustDevice}
      onChange={state.setTrustDevice}
    />
  );

  return (
    <div className={cn(accountLoginFlowClassName, showRouteTabs ? accountEntryLoginFlowClassName : "")}>
      {showRouteTabs ? (
        <AccountAuthRouteTabs activeFlow={state.activeFlow} onFlowChange={state.switchFlow} />
      ) : null}
      <form
        aria-busy={state.isSubmitting}
        aria-describedby={formError ? state.formErrorId : undefined}
        className={authCardClassName}
        onSubmit={state.submitForm}
      >
        <span className={accountStepKickerClassName}>{state.stepLabel}</span>
        {formError ? <StatusMessage id={state.formErrorId} tone="danger">{formError}</StatusMessage> : null}
        <EmailLoginStepStage
          activeFlow={state.activeFlow}
          authStep={state.authStep}
          code={state.code}
          codeHintId={state.codeHintId}
          codeInputId={state.codeInputId}
          displayName={state.displayName}
          email={state.email}
          emailHintId={state.emailHintId}
          emailInputId={state.emailInputId}
          emailLoginMessages={state.emailLoginMessages}
          hasChallenge={Boolean(state.challenge)}
          homeBase={state.homeBase}
          isEmailInvalid={state.isEmailInvalid}
          isEmailValid={state.isEmailValid}
          isPasswordInvalid={state.isPasswordInvalid}
          isSubmitting={state.isSubmitting}
          normalizedEmail={state.normalizedEmail}
          otpReady={state.otpReady}
          password={state.password}
          passwordAutocomplete={state.passwordAutocomplete}
          passwordHintId={state.passwordHintId}
          passwordInputId={state.passwordInputId}
          passwordReady={state.passwordReady}
          resendCooldown={state.resendCooldown}
          stepHeading={state.stepHeading}
          transitionDirection={state.transitionDirection}
          trustDeviceFields={trustDeviceFields}
          visualStep={state.visualStep}
          changeEmail={state.changeEmail}
          chooseMethods={state.chooseMethods}
          requestEmailCode={state.requestEmailCode}
          resetChallenge={state.resetChallenge}
          setDisplayName={state.setDisplayName}
          setEmail={state.setEmail}
          setHomeBase={state.setHomeBase}
          setPassword={state.setPassword}
          showPasswordStep={state.showPasswordStep}
          signInWithPasskey={state.signInWithPasskey}
          updateCode={state.updateCode}
        />
      </form>
      {!state.challenge ? (
        <AccountAuthFlowSwitch activeFlow={state.activeFlow} onFlowChange={state.switchFlow} />
      ) : null}
    </div>
  );
}
