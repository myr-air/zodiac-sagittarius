import type { AuthFlow } from "../auth";

interface EmailLoginStepDisabledStateInput {
  activeFlow: AuthFlow;
  isEmailValid: boolean;
  isSubmitting: boolean;
  passwordReady: boolean;
  resendCooldown: number;
}

export function buildEmailLoginStepDisabledState({
  activeFlow,
  isEmailValid,
  isSubmitting,
  passwordReady,
  resendCooldown,
}: EmailLoginStepDisabledStateInput) {
  const needsReadyPassword = activeFlow === "register" && !passwordReady;
  return {
    alternateActions: !isEmailValid || isSubmitting,
    codeResend:
      !isEmailValid || needsReadyPassword || isSubmitting || resendCooldown > 0,
    credentialsPrimary: !isEmailValid || !passwordReady || isSubmitting,
  };
}
