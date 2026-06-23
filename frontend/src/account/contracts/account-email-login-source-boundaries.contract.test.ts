import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "../../workspace/contracts/workspace-source-boundaries.sources";

describe("Sagittarius account email login source boundaries", () => {
  it("keeps email login state, actions, auth calls, and step rendering split", () => {
    const {
      emailLoginState,
      emailLoginEntryActions,
      emailLoginAuthActions,
      emailLoginFormState,
      emailLoginChallengeState,
      emailLoginSubmitActions,
      emailLoginCodeRequestActions,
      emailLoginSignInActions,
      emailLoginRegistrationActions,
      emailLoginResendCooldown,
      emailLoginPanel,
      emailLoginPanelForm,
      emailLoginStepDispatch,
      emailLoginStepStage,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(emailLoginState).toContain("./use-email-login-form-state");
    expect(emailLoginState).toContain("./use-email-login-challenge-state");
    expect(emailLoginState).toContain("./use-email-login-entry-actions");
    expect(emailLoginState).toContain("../submit/use-email-login-submit-actions");
    expect(emailLoginState).not.toContain("./submit/email-login-auth-actions");
    expect(emailLoginState).not.toContain("buildPasskeyLoginFinishInput");
    expect(emailLoginState).not.toContain("finishPasswordLogin({");
    expect(emailLoginState).not.toContain("finishEmailLogin({");
    expect(emailLoginState).not.toContain("finishEmailCodeLogin");
    expect(emailLoginState).not.toContain("finishEmailPasswordLogin");
    expect(emailLoginState).not.toContain("finishEmailRegistrationSetup");
    expect(emailLoginState).not.toContain("signInWithEmailPasskey");
    expect(emailLoginState).not.toContain("window.setInterval");
    expect(emailLoginState).not.toContain("window.history.replaceState");
    expect(emailLoginState).not.toContain("appRoutes.register()");
    expect(emailLoginState).not.toContain("replace(/\\D/g");
    expect(emailLoginEntryActions).toContain("export function useEmailLoginEntryActions");
    expect(emailLoginEntryActions).toContain("window.history.replaceState");
    expect(emailLoginEntryActions).toContain("appRoutes.register()");
    expect(emailLoginAuthActions).toContain("export async function finishEmailCodeLogin");
    expect(emailLoginAuthActions).toContain("export async function finishEmailPasswordLogin");
    expect(emailLoginAuthActions).toContain("export async function signInWithEmailPasskey");
    expect(emailLoginAuthActions).toContain("buildPasskeyLoginFinishInput");
    expect(emailLoginAuthActions).not.toContain("arrayBufferToBase64Url");
    expect(emailLoginFormState).toContain("export function useEmailLoginFormState");
    expect(emailLoginFormState).toContain("function updateCode");
    expect(emailLoginChallengeState).toContain("useEmailLoginResendCooldown");
    expect(emailLoginChallengeState).toContain("export function useEmailLoginChallengeState");
    expect(emailLoginSubmitActions).toContain("export function useEmailLoginSubmitActions");
    expect(emailLoginSubmitActions).toContain("useEmailLoginCodeRequestActions");
    expect(emailLoginSubmitActions).toContain("useEmailLoginRegistrationActions");
    expect(emailLoginSubmitActions).toContain("useEmailLoginSignInActions");
    expect(emailLoginSubmitActions).not.toContain("./email-login-auth-actions");
    expect(emailLoginSubmitActions).not.toContain("./email-login-submit-errors");
    expect(emailLoginSubmitActions).not.toContain("passwordLoginErrorMessage");
    expect(emailLoginSubmitActions).not.toContain("finishEmailCodeLogin");
    expect(emailLoginCodeRequestActions).toContain("emailLoginStartError");
    expect(emailLoginSignInActions).toContain("finishEmailPasswordLogin");
    expect(emailLoginSignInActions).toContain("signInWithEmailPasskey");
    expect(emailLoginRegistrationActions).toContain("finishEmailCodeLogin");
    expect(emailLoginRegistrationActions).toContain("finishEmailRegistrationSetup");
    expect(emailLoginResendCooldown).toContain("export function useEmailLoginResendCooldown");
    expect(emailLoginResendCooldown).toContain("window.setInterval");
    expect(emailLoginStepDispatch).toContain("../steps/account-email-login-credentials-step");
    expect(emailLoginStepDispatch).toContain("../steps/account-email-login-methods-step");
    expect(emailLoginStepDispatch).toContain("../steps/account-email-login-otp-step");
    expect(emailLoginStepDispatch).toContain("../steps/account-email-login-password-step");
    expect(emailLoginStepDispatch).toContain("../steps/account-email-login-setup-step");
    expect(emailLoginStepDispatch).toContain("../model/account-email-login-step-labels");
    expect(emailLoginStepDispatch).not.toContain("./account-email-login-step-content");
    expect(emailLoginStepDispatch).not.toContain("interface EmailLoginCredentialsStepProps");
    expect(emailLoginStepDispatch).not.toContain("function EmailLoginCredentialsStep");
    expect(emailLoginPanel).toContain("EmailLoginPanelForm");
    expect(emailLoginPanel).toContain("useEmailLoginPanelState");
    expect(emailLoginPanel).not.toContain("EmailLoginStepStage");
    expect(emailLoginPanel).not.toContain("EmailLoginCredentialsStep");
    expect(emailLoginPanelForm).toContain("EmailLoginStepStage");
    expect(emailLoginPanelForm).toContain("AccountAuthRouteTabs");
    expect(emailLoginPanelForm).toContain("AccountAuthFlowSwitch");
    expect(emailLoginStepStage).toContain("export function EmailLoginStepStage");
    expect(emailLoginStepStage).toContain("EmailLoginStepContent");
    expect(emailLoginStepStage).not.toContain("EmailLoginCredentialsStep");
  });
});
