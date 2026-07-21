"use client";

import { useEffect, useState, useSyncExternalStore, startTransition } from "react";
import { PortalNav } from "@/components/portal/PortalNav";
import { AccountSettingsComingSoon } from "@/components/account/AccountSettingsComingSoon";
import { AccountSettingsDevices } from "@/components/account/AccountSettingsDevices";
import { AccountSettingsPasskeys } from "@/components/account/AccountSettingsPasskeys";
import { AccountSettingsProfileForm } from "@/components/account/AccountSettingsProfileForm";
import { accountHomeGate } from "@/src/account/account-home-gate";
import {
  accountDisplayInitials,
  type AccountSettingsIdentity,
} from "@/src/account/account-settings-load";
import {
  accountSettingsFormFromProfile,
  isAccountSettingsFormDirty,
  type AccountSettingsForm,
} from "@/src/account/account-settings-form";
import {
  fetchAccountSettings,
  patchAccountSettings,
  type PasskeySummary,
  type TrustedDeviceSummary,
} from "@/src/account/account-api";
import { defaultApiBaseUrl } from "@/src/auth/email-challenge";

function readSessionToken(): string | null {
  const gate = accountHomeGate(
    typeof window !== "undefined" ? window.localStorage : null,
  );
  return gate.kind === "home" ? gate.session.sessionToken : null;
}

function useAccountSessionToken(): string | null | undefined {
  return useSyncExternalStore(
    () => () => {},
    readSessionToken,
    () => undefined,
  );
}

function identityFromProfile(profile: {
  displayName: string;
  avatarColor: string;
  primaryEmail: string | null;
}): AccountSettingsIdentity {
  return {
    displayName: profile.displayName,
    primaryEmail: profile.primaryEmail ?? "",
    avatarColor: profile.avatarColor,
    initials: accountDisplayInitials(profile.displayName),
  };
}

const NO_SESSION_ERROR = "Session is missing or invalid.";

export function AccountSettingsPage() {
  const sessionToken = useAccountSessionToken();
  const [identity, setIdentity] = useState<AccountSettingsIdentity | null>(
    null,
  );
  const [form, setForm] = useState<AccountSettingsForm | null>(null);
  const [baseline, setBaseline] = useState<AccountSettingsForm | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeySummary[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDeviceSummary[]>(
    [],
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionToken === undefined) return;

    if (sessionToken === null) {
      startTransition(() => {
        setIdentity(null);
        setForm(null);
        setBaseline(null);
        setPasskeys([]);
        setTrustedDevices([]);
        setLoadError(NO_SESSION_ERROR);
      });
      return;
    }

    let cancelled = false;

    void fetchAccountSettings(
      { sessionToken },
      { fetch, apiBaseUrl: defaultApiBaseUrl() },
    ).then((outcome) => {
      if (cancelled) return;
      startTransition(() => {
        if (outcome.ok) {
          const nextForm = accountSettingsFormFromProfile(outcome.profile);
          setIdentity(identityFromProfile(outcome.profile));
          setForm(nextForm);
          setBaseline(nextForm);
          setPasskeys(outcome.passkeys);
          setTrustedDevices(outcome.trustedDevices);
          setLoadError(null);
        } else {
          setIdentity(null);
          setForm(null);
          setBaseline(null);
          setPasskeys([]);
          setTrustedDevices([]);
          setLoadError(outcome.error);
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  const dirty =
    form !== null && baseline !== null
      ? isAccountSettingsFormDirty(form, baseline)
      : false;

  async function handleSave() {
    if (!sessionToken || !form || !dirty || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const outcome = await patchAccountSettings(
        {
          sessionToken,
          displayName: form.displayName.trim(),
          avatarColor: form.avatarColor,
          locale: form.locale,
          timezone: form.timezone,
          homeCity: form.homeCity.trim(),
          homeCountry: form.homeCountry.trim(),
        },
        { fetch, apiBaseUrl: defaultApiBaseUrl() },
      );
      if (!outcome.ok) {
        setSaveError(outcome.error);
        return;
      }
      const nextForm = accountSettingsFormFromProfile(outcome.profile);
      startTransition(() => {
        setIdentity(identityFromProfile(outcome.profile));
        setForm(nextForm);
        setBaseline(nextForm);
        setPasskeys(outcome.passkeys);
        setTrustedDevices(outcome.trustedDevices);
        setSaveError(null);
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="portal-shell-root min-h-dvh bg-(--color-page) text-(--color-text)">
      <PortalNav />
      <main className="portal-shell account-settings-shell">
        <div className="portal-page-head">
          <div>
            <h1>Account settings</h1>
            <p>Live settings now · more features marked Coming soon.</p>
          </div>
          {form ? (
            <button
              type="button"
              className="portal-btn portal-btn--primary account-settings-save-desk"
              disabled={!dirty || saving}
              onClick={() => void handleSave()}
            >
              Save
            </button>
          ) : null}
        </div>

        {loadError ? (
          <p role="alert" className="text-sm text-(--color-danger)">
            {loadError}
          </p>
        ) : null}

        {saveError ? (
          <p role="alert" className="text-sm text-(--color-danger)">
            {saveError}
          </p>
        ) : null}

        {!loadError && identity ? (
          <section
            className="account-settings-identity"
            aria-label="Identity"
            style={
              {
                ["--account-avatar" as string]: identity.avatarColor,
              } as React.CSSProperties
            }
          >
            <div
              className="account-settings-avatar"
              style={{ backgroundColor: identity.avatarColor }}
            >
              {identity.initials}
            </div>
            <div>
              <strong className="account-settings-name">
                {identity.displayName}
              </strong>
              <div className="account-settings-email">
                {identity.primaryEmail}
              </div>
              <span className="account-settings-email-chip">
                Primary · verified
              </span>
            </div>
          </section>
        ) : null}

        {!loadError && form ? (
          <>
            <AccountSettingsProfileForm form={form} onChange={setForm} />
            <AccountSettingsComingSoon
              primaryEmail={identity?.primaryEmail ?? ""}
              sessionToken={sessionToken}
              securityAfterTotp={
                sessionToken ? (
                  <>
                    <AccountSettingsPasskeys
                      passkeys={passkeys}
                      sessionToken={sessionToken}
                      onPasskeysChange={setPasskeys}
                    />
                    <AccountSettingsDevices
                      trustedDevices={trustedDevices}
                      sessionToken={sessionToken}
                      onTrustedDevicesChange={setTrustedDevices}
                    />
                  </>
                ) : null
              }
            />
          </>
        ) : null}
      </main>

      {form ? (
        <div className="account-settings-dock">
          <button
            type="button"
            className="portal-btn portal-btn--primary"
            disabled={!dirty || saving}
            onClick={() => void handleSave()}
          >
            Save
          </button>
        </div>
      ) : null}
    </div>
  );
}
