"use client";

import { type FormEvent, useState } from "react";
import type {
  AccountApiClient,
  AccountSession,
  AccountSettings,
  AccountSettingsUpdateRequest,
} from "@/src/account/api-client";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import {
  errorMessage,
  formatDateTime,
  profileToForm,
} from "../account-auth-support";
import { SettingLine } from "./account-portal-primitives";

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
  const [form, setForm] = useState<AccountSettingsUpdateRequest>(() => profileToForm(settings));
  const [isSaving, setIsSaving] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const nextSettings = await accountClient.updateSettings(accountSession.sessionToken, form);
      onSettingsChanged(nextSettings);
      setForm(profileToForm(nextSettings));
      onMessage(t.access.settings.messages.saved);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.settings.messages.saveFailed, t.access.messages));
    } finally {
      setIsSaving(false);
    }
  }

  async function revokeDevice(deviceId: string) {
    setRevokingDeviceId(deviceId);
    try {
      await accountClient.revokeTrustedDevice(accountSession.sessionToken, deviceId);
      if (accountSession.trustedDeviceId === deviceId) {
        onSessionCleared();
        onMessage(t.access.settings.messages.currentDeviceRevoked);
        onError(null);
        return;
      }
      const nextSettings = await accountClient.loadSettings(accountSession.sessionToken);
      onSettingsChanged(nextSettings);
      onMessage(t.access.settings.messages.deviceRevoked);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.settings.messages.revokeFailed, t.access.messages));
    } finally {
      setRevokingDeviceId(null);
    }
  }

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

      <div className={classNames.deviceList} aria-label={t.access.settings.trustedDevicesLabel}>
        {settings.trustedDevices.length ? (
          settings.trustedDevices.map((device) => (
            <div className={classNames.deviceRow} key={device.id}>
              <div>
                <strong>{device.label}</strong>
                <span>
                  {device.userAgent || t.access.settings.unknownBrowser} ·{" "}
                  {device.lastSeenAt ? formatDateTime(device.lastSeenAt, locale) : formatDateTime(device.createdAt, locale)}
                </span>
              </div>
              <Button type="button" variant="secondary" onClick={() => void revokeDevice(device.id)} disabled={revokingDeviceId === device.id}>
                <Icon name="x" />
                {t.access.settings.revoke}
              </Button>
            </div>
          ))
        ) : (
          <p className={classNames.empty}>{t.access.settings.noTrustedDevices}</p>
        )}
      </div>
    </>
  );
}
