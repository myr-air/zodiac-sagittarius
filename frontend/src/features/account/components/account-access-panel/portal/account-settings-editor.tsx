"use client";

import type {
  AccountApiClient,
  AccountSession,
  AccountSettings,
} from "@/src/account/api-client";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { SettingLine } from "./account-portal-primitives";
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
      <form className={classNames.settingsForm} onSubmit={submitSettings}>
        <div className={classNames.twoCol}>
          <label>
            <span>{t.access.settings.form.displayName}</span>
            <input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} required />
          </label>
          <label>
            <span>{t.access.settings.form.avatarColor}</span>
            <input
              value={form.avatarColor}
              onChange={(event) => setForm((current) => ({ ...current, avatarColor: event.target.value }))}
              pattern="#[0-9a-fA-F]{6}"
              type="color"
              required
            />
          </label>
          <label>
            <span>{t.access.settings.form.locale}</span>
            <Select value={form.locale} onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))} required>
              <option value="th-TH">Thai</option>
              <option value="en-US">English</option>
            </Select>
          </label>
          <label>
            <span>{t.access.settings.form.timezone}</span>
            <input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} required />
          </label>
          <label>
            <span>Home city</span>
            <input value={form.homeCity ?? ""} onChange={(event) => setForm((current) => ({ ...current, homeCity: event.target.value }))} placeholder="Bangkok" />
          </label>
          <label>
            <span>Home country</span>
            <input value={form.homeCountry ?? ""} onChange={(event) => setForm((current) => ({ ...current, homeCountry: event.target.value }))} placeholder="Thailand" />
          </label>
        </div>
        <Button type="submit" disabled={isSaving}>
          <Icon name="check" />
          {t.access.settings.form.save}
        </Button>
      </form>

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
