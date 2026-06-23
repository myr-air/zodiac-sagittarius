import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "../../workspace/contracts/workspace-source-boundaries.sources";

describe("Sagittarius account settings source boundaries", () => {
  it("keeps portal settings, profile editing, passkeys, and auth support split by responsibility", () => {
    const {
      accountAuthDateTime,
      accountPasskeySupport,
      accountPasskeyLoginInput,
      accountPortalSettingsSection,
      accountPortalSettingsPasskeyActions,
      accountSettingsEditor,
      accountSettingsProfileFormModel,
      accountSettingsEditorState,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(accountPortalSettingsSection).toContain("usePortalSettingsPasskeyActions");
    expect(accountPortalSettingsSection).not.toContain("createPasskeyCredential");
    expect(accountPortalSettingsSection).not.toContain("arrayBufferToBase64Url");
    expect(accountPortalSettingsPasskeyActions).toContain(
      "export function usePortalSettingsPasskeyActions",
    );
    expect(accountPortalSettingsPasskeyActions).toContain("createPasskeyCredential");
    expect(accountPortalSettingsPasskeyActions).toContain("finishPasskeyRegistration");
    expect(accountSettingsEditor).toContain("useAccountSettingsEditorState");
    expect(accountSettingsEditor).not.toContain("profileToForm");
    expect(accountSettingsEditor).not.toContain("function submitSettings");
    expect(accountSettingsProfileFormModel).toContain(
      "export function accountSettingsProfileToForm",
    );
    expect(accountSettingsProfileFormModel).toContain(
      "homeCity: settings.profile.homeCity ??",
    );
    expect(accountSettingsEditorState).toContain(
      "export function useAccountSettingsEditorState",
    );
    expect(accountSettingsEditorState).toContain("accountSettingsProfileToForm");
    expect(accountSettingsEditorState).not.toContain(
      "homeCity: settings.profile.homeCity ??",
    );
    expect(accountSettingsEditorState).toContain("function submitSettings");
    expect(accountAuthDateTime).toContain("formatDisplayDateTime");
    expect(accountAuthDateTime).toContain("displayDateTimeLocaleCode");
    expect(accountAuthDateTime).toContain("export function formatDateTime");
    expect(accountAuthDateTime).not.toContain("./account-access-error-codes");
    expect(accountAuthDateTime).not.toContain("./account-passkey-support");
    expect(accountAuthDateTime).not.toContain("buildPasskeyLoginFinishInput");
    expect(accountAuthDateTime).not.toContain("profileToForm");
    expect(accountAuthDateTime).not.toContain("accountLoadFailed:");
    expect(accountAuthDateTime).not.toContain("function createPasskeyCredential");
    expect(accountAuthDateTime).not.toContain("function getPasskeyCredential");
    expect(accountAuthDateTime).not.toContain("function base64UrlToArrayBuffer");
    expect(accountAuthDateTime).not.toContain("function arrayBufferToBase64Url");
    expect(accountPasskeySupport).toContain(
      "export async function createPasskeyCredential",
    );
    expect(accountPasskeySupport).toContain(
      "export async function getPasskeyCredential",
    );
    expect(accountPasskeySupport).toContain("./account-passkey-login-input");
    expect(accountPasskeySupport).not.toContain("finishPasskeyLogin");
    expect(accountPasskeySupport).not.toContain("credentialId: arrayBufferToBase64Url");
    expect(accountPasskeyLoginInput).toContain(
      "export function buildPasskeyLoginFinishInput",
    );
    expect(accountPasskeyLoginInput).toContain(
      'Parameters<AccountApiClient["finishPasskeyLogin"]>[0]',
    );
    expect(accountPasskeyLoginInput).not.toContain("navigator.credentials");
  });
});
