import type {
  AccountApiClient,
  AccountSession,
  AccountSettings,
} from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import {
  arrayBufferToBase64Url,
  createPasskeyCredential,
  errorMessage,
} from "../auth";

interface UsePortalSettingsPasskeyActionsInput {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  labels: Messages["access"];
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
  onSettingsChanged: (settings: AccountSettings) => void;
  settings: AccountSettings | null;
}

export function usePortalSettingsPasskeyActions({
  accountClient,
  accountSession,
  labels,
  onError,
  onMessage,
  onSettingsChanged,
  settings,
}: UsePortalSettingsPasskeyActionsInput) {
  async function registerPasskey() {
    if (!settings) return;
    try {
      const registrationStart = await accountClient.startPasskeyRegistration(
        accountSession.sessionToken,
      );
      const credential = await createPasskeyCredential(
        registrationStart.challenge,
        settings,
      );
      const passkey = await accountClient.finishPasskeyRegistration(
        accountSession.sessionToken,
        {
          challengeId: registrationStart.challengeId,
          credentialId: arrayBufferToBase64Url(credential.rawId),
          clientDataJson: arrayBufferToBase64Url(
            credential.response.clientDataJSON,
          ),
          attestationObject: arrayBufferToBase64Url(
            credential.response.attestationObject,
          ),
          nickname: `${settings.profile.displayName} passkey`,
        },
      );
      onSettingsChanged({
        ...settings,
        passkeys: [
          passkey,
          ...settings.passkeys.filter(
            (candidate) => candidate.id !== passkey.id,
          ),
        ],
      });
      onMessage(labels.settings.messages.passkeyCreated);
      onError(null);
    } catch (caught) {
      onError(
        errorMessage(
          caught,
          labels.settings.messages.passkeyFailed,
          labels.messages,
        ),
      );
    }
  }

  return {
    registerPasskey,
  };
}
