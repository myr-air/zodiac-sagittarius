"use client";

import type {
  AccountApiClient,
  AccountSession,
  AccountSettings,
} from "@/src/account/api-client";
import { useI18n } from "@/src/i18n/I18nProvider";
import { SettingLine } from "../account-portal-primitives";
import { AccountSettingsProfileForm } from "./account-settings-profile-form";
import { AccountTrustedDevicesList } from "./account-trusted-devices-list";
import { useAccountSettingsEditorState } from "./use-account-settings-editor-state";

export interface AccountSettingsEditorClassNames {
  avatar: string;
  deviceList: string;
  deviceRow: string;
  empty: string;
  settingsForm: string;
  settingsGrid: string;
  twoCol: string;
  profilePreview: string;
}

export function AccountSettingsEditor({
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
  classNames: AccountSettingsEditorClassNames;
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
  onSessionCleared: () => void;
  onSettingsChanged: (settings: AccountSettings) => void;
  settings: AccountSettings;
}) {
  const { locale, t } = useI18n();
  const {
    form,
    isSaving,
    revokeDevice,
    revokingDeviceId,
    setForm,
    submitSettings,
  } = useAccountSettingsEditorState({
    accountClient,
    accountSession,
    labels: t.access,
    onError,
    onMessage,
    onSessionCleared,
    onSettingsChanged,
    settings,
  });

  return (
    <>
      <div className={classNames.profilePreview}>
        <span className={classNames.avatar} style={{ backgroundColor: form.avatarColor }} aria-hidden="true">
          {form.displayName.slice(0, 1) || "A"}
        </span>
        <div>
          <strong>{form.displayName}</strong>
          <span>{settings.profile.primaryEmail ?? t.access.dashboard.noEmail}</span>
        </div>
      </div>
      <AccountSettingsProfileForm
        classNames={{
          settingsForm: classNames.settingsForm,
          twoCol: classNames.twoCol,
        }}
        form={form}
        isSaving={isSaving}
        labels={t.access.settings.form}
        onSubmit={submitSettings}
        setForm={setForm}
      />

      <div className={classNames.settingsGrid}>
        <SettingLine label={t.access.settings.passkeys} value={`${settings.passkeys.length}`} />
        <SettingLine label={t.access.settings.trustedDevices} value={`${settings.trustedDevices.length}`} />
      </div>

      <AccountTrustedDevicesList
        classNames={{
          deviceList: classNames.deviceList,
          deviceRow: classNames.deviceRow,
          empty: classNames.empty,
        }}
        labels={t.access.settings}
        locale={locale}
        onRevokeDevice={(deviceId) => void revokeDevice(deviceId)}
        revokingDeviceId={revokingDeviceId}
        trustedDevices={settings.trustedDevices}
      />
    </>
  );
}
