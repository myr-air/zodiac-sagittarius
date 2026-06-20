"use client";

import { useState, type FormEvent } from "react";
import type {
  AccountApiClient,
  AccountSession,
  AccountSettings,
  AccountSettingsUpdateRequest,
} from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import { errorMessage, profileToForm } from "../auth";

interface AccountSettingsEditorStateInput {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  labels: Messages["access"];
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
  onSessionCleared: () => void;
  onSettingsChanged: (settings: AccountSettings) => void;
  settings: AccountSettings;
}

export function useAccountSettingsEditorState({
  accountClient,
  accountSession,
  labels,
  onError,
  onMessage,
  onSessionCleared,
  onSettingsChanged,
  settings,
}: AccountSettingsEditorStateInput) {
  const [form, setForm] = useState<AccountSettingsUpdateRequest>(() =>
    profileToForm(settings),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const nextSettings = await accountClient.updateSettings(
        accountSession.sessionToken,
        form,
      );
      onSettingsChanged(nextSettings);
      setForm(profileToForm(nextSettings));
      onMessage(labels.settings.messages.saved);
      onError(null);
    } catch (caught) {
      onError(
        errorMessage(
          caught,
          labels.settings.messages.saveFailed,
          labels.messages,
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function revokeDevice(deviceId: string) {
    setRevokingDeviceId(deviceId);
    try {
      await accountClient.revokeTrustedDevice(
        accountSession.sessionToken,
        deviceId,
      );
      if (accountSession.trustedDeviceId === deviceId) {
        onSessionCleared();
        onMessage(labels.settings.messages.currentDeviceRevoked);
        onError(null);
        return;
      }
      const nextSettings = await accountClient.loadSettings(
        accountSession.sessionToken,
      );
      onSettingsChanged(nextSettings);
      onMessage(labels.settings.messages.deviceRevoked);
      onError(null);
    } catch (caught) {
      onError(
        errorMessage(
          caught,
          labels.settings.messages.revokeFailed,
          labels.messages,
        ),
      );
    } finally {
      setRevokingDeviceId(null);
    }
  }

  return {
    form,
    isSaving,
    revokeDevice,
    revokingDeviceId,
    setForm,
    submitSettings,
  };
}
