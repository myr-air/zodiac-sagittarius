import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const emailLoginDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readEmailLoginSource(fileName: string) {
  return readFileSync(join(emailLoginDir, fileName), "utf8");
}

describe("email login state structure", () => {
  it("keeps resend cooldown timer state out of the main login panel hook", () => {
    const panelState = readEmailLoginSource("state/use-email-login-panel-state.ts");
    const challengeState = readEmailLoginSource("state/use-email-login-challenge-state.ts");
    const resendCooldown = readEmailLoginSource("state/use-email-login-resend-cooldown.ts");

    expect(panelState).toContain("useEmailLoginChallengeState");
    expect(panelState).not.toContain("useEmailLoginResendCooldown");
    expect(challengeState).toContain("useEmailLoginResendCooldown");
    expect(challengeState).toContain("setSubmittedChallenge");
    expect(panelState).not.toContain("window.setInterval");
    expect(panelState).not.toContain("useState(0)");
    expect(panelState).not.toMatch(/const \[resendCooldown,\s*setResendCooldown\]/);
    expect(resendCooldown).toContain("export function useEmailLoginResendCooldown");
    expect(resendCooldown).toContain("window.setInterval");
    expect(resendCooldown).toContain("resendCooldownSeconds");
  });

  it("keeps form field state and code normalization out of the main login panel hook", () => {
    const panelState = readEmailLoginSource("state/use-email-login-panel-state.ts");
    const formState = readEmailLoginSource("state/use-email-login-form-state.ts");
    const derivedState = readEmailLoginSource("model/email-login-panel-derived-state.ts");
    const validation = readEmailLoginSource("model/email-login-validation.ts");
    const styles = readEmailLoginSource("ui/account-email-login-styles.ts");

    expect(panelState).toContain("useEmailLoginFormState");
    expect(panelState).not.toMatch(/const \[email,\s*setEmail\]/);
    expect(panelState).not.toMatch(/const \[password,\s*setPassword\]/);
    expect(panelState).not.toMatch(/const \[code,\s*setCode\]/);
    expect(panelState).not.toContain("replace(/\\D/g");
    expect(formState).toContain("export function useEmailLoginFormState");
    expect(formState).toContain("function updateCode");
    expect(formState).toContain("resetEntryFields");
    expect(derivedState).toContain("./email-login-validation");
    expect(derivedState).toContain("normalizeEmailLoginEmail");
    expect(derivedState).toContain("isEmailLoginEmailValid");
    expect(derivedState).toContain("isEmailLoginOtpReady");
    expect(derivedState).toContain("isEmailLoginPasswordReady");
    expect(validation).toContain("export const emailLoginEmailPattern");
    expect(styles).not.toContain("emailLoginEmailPattern");
    expect(styles).not.toContain("accountEmailPattern");
  });

  it("keeps auth submit actions out of the main login panel hook", () => {
    const panelState = readEmailLoginSource("state/use-email-login-panel-state.ts");
    const submitActions = readEmailLoginSource("submit/use-email-login-submit-actions.ts");
    const submitErrors = readEmailLoginSource("submit/email-login-submit-errors.ts");
    const submitRoute = readEmailLoginSource("submit/email-login-submit-route.ts");
    const submitRunner = readEmailLoginSource("submit/email-login-submit-runner.ts");
    const codeRequestActions = readEmailLoginSource("submit/use-email-login-code-request-actions.ts");
    const registrationActions = readEmailLoginSource("submit/use-email-login-registration-actions.ts");
    const signInActions = readEmailLoginSource("submit/use-email-login-sign-in-actions.ts");

    expect(panelState).toContain("useEmailLoginSubmitActions");
    expect(panelState).not.toContain("finishEmailCodeLogin");
    expect(panelState).not.toContain("finishEmailPasswordLogin");
    expect(panelState).not.toContain("finishEmailRegistrationSetup");
    expect(panelState).not.toContain("signInWithEmailPasskey");
    expect(panelState).not.toContain("passwordLoginErrorMessage");
    expect(submitActions).toContain("export function useEmailLoginSubmitActions");
    expect(submitActions).toContain("selectEmailLoginSubmitHandler");
    expect(submitActions).toContain("useEmailLoginCodeRequestActions");
    expect(submitActions).toContain("useEmailLoginRegistrationActions");
    expect(submitActions).toContain("useEmailLoginSignInActions");
    expect(submitActions).not.toContain("finishEmailCodeLogin");
    expect(submitActions).not.toContain("finishEmailRegistrationSetup");
    expect(submitActions).not.toContain("./email-login-submit-errors");
    expect(submitActions).not.toContain("startEmailLogin");
    expect(submitActions).not.toContain("emailLoginStartError");
    expect(submitActions).not.toContain("finishEmailPasswordLogin");
    expect(submitActions).not.toContain("signInWithEmailPasskey");
    expect(submitActions).not.toContain("passwordLoginErrorMessage");
    expect(codeRequestActions).toContain("export function useEmailLoginCodeRequestActions");
    expect(codeRequestActions).toContain("startEmailLogin");
    expect(codeRequestActions).toContain("emailLoginStartError");
    expect(codeRequestActions).toContain("runEmailLoginSubmission");
    expect(codeRequestActions).toContain("./email-login-submit-errors");
    expect(registrationActions).toContain("export function useEmailLoginRegistrationActions");
    expect(registrationActions).toContain("finishEmailCodeLogin");
    expect(registrationActions).toContain("finishEmailRegistrationSetup");
    expect(registrationActions).toContain("emailLoginInvalidCodeError");
    expect(registrationActions).toContain("emailLoginPasswordSetupError");
    expect(registrationActions).toContain("runEmailLoginSubmission");
    expect(registrationActions).toContain("./email-login-submit-errors");
    expect(signInActions).toContain("export function useEmailLoginSignInActions");
    expect(signInActions).toContain("finishEmailPasswordLogin");
    expect(signInActions).toContain("signInWithEmailPasskey");
    expect(signInActions).toContain("runEmailLoginSubmission");
    expect(signInActions).toContain("./email-login-submit-errors");
    expect(submitErrors).toContain("export function emailLoginPasswordSubmitError");
    expect(submitErrors).toContain("passwordLoginErrorMessage");
    expect(submitRoute).toContain("export function selectEmailLoginSubmitRoute");
    expect(submitRoute).toContain("export function selectEmailLoginSubmitHandler");
    expect(submitRoute).not.toContain("useState");
    expect(submitRoute).not.toContain("finishEmail");
    expect(submitRunner).toContain("export async function runEmailLoginSubmission");
    expect(submitRunner).toContain("setIsSubmitting(true)");
    expect(submitRunner).toContain("setIsSubmitting(false)");
  });

  it("keeps step transition state out of styles and the main login panel hook", () => {
    const panelState = readEmailLoginSource("state/use-email-login-panel-state.ts");
    const entryActions = readEmailLoginSource("state/use-email-login-entry-actions.ts");
    const stepNavigation = readEmailLoginSource("state/use-email-login-step-navigation.ts");
    const stepTypes = readEmailLoginSource("ui/account-email-login-step.types.ts");
    const styles = readEmailLoginSource("ui/account-email-login-styles.ts");

    expect(panelState).toContain("useEmailLoginEntryActions");
    expect(panelState).toContain("useEmailLoginStepNavigation");
    expect(panelState).not.toMatch(/const \[authStep,\s*setAuthStep\]/);
    expect(panelState).not.toMatch(/const \[transitionDirection,\s*setTransitionDirection\]/);
    expect(panelState).not.toContain("window.history.replaceState");
    expect(panelState).not.toContain("appRoutes.register()");
    expect(entryActions).toContain("export function useEmailLoginEntryActions");
    expect(entryActions).toContain("window.history.replaceState");
    expect(entryActions).toContain("appRoutes.register()");
    expect(stepNavigation).toContain("export const authTransitionDirectionValues");
    expect(stepNavigation).toContain('["forward", "back", "mode"] as const');
    expect(stepNavigation).toContain("export type AuthTransitionDirection");
    expect(stepNavigation).toContain("export function useEmailLoginStepNavigation");
    expect(stepNavigation).toContain("function goToStep");
    expect(styles).toContain("../state/use-email-login-step-navigation");
    expect(styles).not.toContain("export type AuthTransitionDirection");
    expect(styles).not.toContain("accountStepSummaryClassName");
    expect(styles).not.toContain("buildAccountAuthCardClassName");
    expect(stepTypes).toContain(
      "../state/use-email-login-step-navigation",
    );
    expect(readEmailLoginSource("ui/account-email-login-step-stage.tsx")).not.toContain(
      "../state/use-email-login-step-navigation",
    );
  });
});
