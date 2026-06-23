"use client";

import type { AccountApiClient, AccountSession, AccountSettings } from "@/src/account/api-client";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { AccountSettingsEditor } from "./account-settings-editor";
import { PanelHeading } from "../primitives/account-panel-heading";
import { usePortalSettingsPasskeyActions } from "./usePortalSettingsPasskeyActions";

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
  const actions = usePortalSettingsPasskeyActions({
    accountClient,
    accountSession,
    labels: t.access,
    onError,
    onMessage,
    onSettingsChanged,
    settings,
  });

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
        onClick={() => void actions.registerPasskey()}
      >
        <Icon name="key" />
        {t.access.settings.startPasskeySetup}
      </Button>
    </section>
  );
}
