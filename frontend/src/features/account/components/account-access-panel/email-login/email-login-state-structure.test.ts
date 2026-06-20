import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const emailLoginDir = dirname(fileURLToPath(import.meta.url));

function readEmailLoginSource(fileName: string) {
  return readFileSync(join(emailLoginDir, fileName), "utf8");
}

describe("email login state structure", () => {
  it("keeps resend cooldown timer state out of the main login panel hook", () => {
    const panelState = readEmailLoginSource("use-email-login-panel-state.ts");
    const resendCooldown = readEmailLoginSource("use-email-login-resend-cooldown.ts");

    expect(panelState).toContain("useEmailLoginResendCooldown");
    expect(panelState).not.toContain("window.setInterval");
    expect(panelState).not.toContain("useState(0)");
    expect(panelState).not.toMatch(/const \[resendCooldown,\s*setResendCooldown\]/);
    expect(resendCooldown).toContain("export function useEmailLoginResendCooldown");
    expect(resendCooldown).toContain("window.setInterval");
    expect(resendCooldown).toContain("resendCooldownSeconds");
  });

  it("keeps form field state and code normalization out of the main login panel hook", () => {
    const panelState = readEmailLoginSource("use-email-login-panel-state.ts");
    const formState = readEmailLoginSource("use-email-login-form-state.ts");

    expect(panelState).toContain("useEmailLoginFormState");
    expect(panelState).not.toMatch(/const \[email,\s*setEmail\]/);
    expect(panelState).not.toMatch(/const \[password,\s*setPassword\]/);
    expect(panelState).not.toMatch(/const \[code,\s*setCode\]/);
    expect(panelState).not.toContain("replace(/\\D/g");
    expect(formState).toContain("export function useEmailLoginFormState");
    expect(formState).toContain("function updateCode");
    expect(formState).toContain("resetEntryFields");
  });

  it("keeps auth submit actions out of the main login panel hook", () => {
    const panelState = readEmailLoginSource("use-email-login-panel-state.ts");
    const submitActions = readEmailLoginSource("use-email-login-submit-actions.ts");
    const submitRoute = readEmailLoginSource("email-login-submit-route.ts");

    expect(panelState).toContain("useEmailLoginSubmitActions");
    expect(panelState).not.toContain("finishEmailCodeLogin");
    expect(panelState).not.toContain("finishEmailPasswordLogin");
    expect(panelState).not.toContain("finishEmailRegistrationSetup");
    expect(panelState).not.toContain("signInWithEmailPasskey");
    expect(panelState).not.toContain("passwordLoginErrorMessage");
    expect(submitActions).toContain("export function useEmailLoginSubmitActions");
    expect(submitActions).toContain("finishEmailCodeLogin");
    expect(submitActions).toContain("finishEmailPasswordLogin");
    expect(submitActions).toContain("finishEmailRegistrationSetup");
    expect(submitActions).toContain("signInWithEmailPasskey");
    expect(submitActions).toContain("selectEmailLoginSubmitHandler");
    expect(submitRoute).toContain("export function selectEmailLoginSubmitRoute");
    expect(submitRoute).toContain("export function selectEmailLoginSubmitHandler");
    expect(submitRoute).not.toContain("useState");
    expect(submitRoute).not.toContain("finishEmail");
  });

  it("keeps step transition state out of styles and the main login panel hook", () => {
    const panelState = readEmailLoginSource("use-email-login-panel-state.ts");
    const stepNavigation = readEmailLoginSource("use-email-login-step-navigation.ts");
    const styles = readEmailLoginSource("account-email-login-styles.ts");

    expect(panelState).toContain("useEmailLoginStepNavigation");
    expect(panelState).not.toMatch(/const \[authStep,\s*setAuthStep\]/);
    expect(panelState).not.toMatch(/const \[transitionDirection,\s*setTransitionDirection\]/);
    expect(stepNavigation).toContain("export type AuthTransitionDirection");
    expect(stepNavigation).toContain("export function useEmailLoginStepNavigation");
    expect(stepNavigation).toContain("function goToStep");
    expect(styles).toContain("./use-email-login-step-navigation");
    expect(styles).not.toContain("export type AuthTransitionDirection");
    expect(readEmailLoginSource("account-email-login-step-stage.tsx")).toContain(
      "./use-email-login-step-navigation",
    );
  });
});
