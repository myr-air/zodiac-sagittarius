"use client";

import type { AccountApiClient, AccountSession, AccountSettings } from "@/src/account/api-client";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import {
  arrayBufferToBase64Url,
  createPasskeyCredential,
  errorMessage,
} from "./account-auth-support";
import { AccountSettingsEditor } from "./account-settings-editor";
import { PanelHeading } from "./account-portal-primitives";

interface PortalSettingsSectionClassNames {
  avatar: string;
  deviceList: string;
  deviceRow: string;
  empty: string;
  profilePreview: string;
  section: string;
  settingsForm: string;
  settingsGrid: string;
  twoCol: string;
}

export function PortalSettingsSection({
  accountClient,
  accountSession,
  classNames,
  onError,
  onMessage,
  onSessionCleared,
  onSettingsChanged,
  settings,
}: {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  classNames: PortalSettingsSectionClassNames;
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
  onSessionCleared: () => void;
  onSettingsChanged: (settings: AccountSettings) => void;
  settings: AccountSettings | null;
}) {
  const { t } = useI18n();

  async function registerPasskey() {
    if (!settings) return;
    try {
      const registrationStart = await accountClient.startPasskeyRegistration(accountSession.sessionToken);
      const credential = await createPasskeyCredential(registrationStart.challenge, settings);
      const passkey = await accountClient.finishPasskeyRegistration(accountSession.sessionToken, {
        challengeId: registrationStart.challengeId,
        credentialId: arrayBufferToBase64Url(credential.rawId),
        clientDataJson: arrayBufferToBase64Url(credential.response.clientDataJSON),
        attestationObject: arrayBufferToBase64Url(credential.response.attestationObject),
        nickname: `${settings.profile.displayName} passkey`,
      });
      onSettingsChanged({
        ...settings,
        passkeys: [passkey, ...settings.passkeys.filter((candidate) => candidate.id !== passkey.id)],
      });
      onMessage(t.access.settings.messages.passkeyCreated);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.settings.messages.passkeyFailed, t.access.messages));
    }
  }

  return (
    <section className={classNames.section} id="portal-settings">
      <PanelHeading icon="settings" title={t.access.settings.title} detail={t.access.settings.detail} />
      {settings ? (
        <AccountSettingsEditor
          accountClient={accountClient}
          accountSession={accountSession}
          classNames={{
            avatar: classNames.avatar,
            deviceList: classNames.deviceList,
            deviceRow: classNames.deviceRow,
            empty: classNames.empty,
            profilePreview: classNames.profilePreview,
            settingsForm: classNames.settingsForm,
            settingsGrid: classNames.settingsGrid,
            twoCol: classNames.twoCol,
          }}
          settings={settings}
          onError={onError}
          onMessage={onMessage}
          onSessionCleared={onSessionCleared}
          onSettingsChanged={onSettingsChanged}
        />
      ) : (
        <p className={classNames.empty}>{t.access.settings.loading}</p>
      )}
      <Button
        type="button"
        variant="secondary"
        disabled={!settings}
        onClick={() => void registerPasskey()}
      >
        <Icon name="key" />
        {t.access.settings.startPasskeySetup}
      </Button>
    </section>
  );
}
