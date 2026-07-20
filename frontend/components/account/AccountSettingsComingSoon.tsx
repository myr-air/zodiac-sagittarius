/**
 * Account settings Coming soon — Connections + Security chrome (draft-v2).
 * Non-acting labeled UI only. Passkeys (T5) / Trusted devices (T6) slot in
 * via `securityAfterTotp` (after Email/Password/TOTP, before Close account).
 */

import type { ReactNode } from "react";

const CONNECTION_PROVIDERS = [
  {
    group: "Libraries",
    mark: "drive",
    label: "Dr",
    name: "Google Drive",
    off: "Folders & booking docs",
  },
  {
    group: "Libraries",
    mark: "photos",
    label: "Ph",
    name: "Google Photos",
    off: "Trip photo albums",
  },
  {
    group: "Social",
    mark: "ig",
    label: "Ig",
    name: "Instagram",
    off: "Moments & stories",
  },
  {
    group: "Social",
    mark: "fb",
    label: "Fb",
    name: "Facebook",
    off: "Invites & updates",
  },
  {
    group: "Social",
    mark: "line",
    label: "LN",
    name: "LINE",
    off: "SEA chats & invites",
  },
] as const;

const CONNECTIONS_SOON_NOTE =
  "Account OAuth is not available yet. Trip album links can still use Google providers as URLs.";

/** Coming soon rows before live Passkeys / Trusted devices. */
const SECURITY_SOON_BEFORE = [
  {
    title: "Email",
    note: "Change-email flow needs a new verified challenge API — not in this ship.",
    danger: false,
  },
  {
    title: "Password",
    note: "Sign-in password exists; authenticated change-password endpoint does not yet.",
    danger: false,
  },
  {
    title: "Two-factor (TOTP)",
    note: "Authenticator 2FA needs new secret storage and login challenge — use passkeys today.",
    danger: false,
  },
] as const;

/** Coming soon rows after live Passkeys / Trusted devices. */
const SECURITY_SOON_AFTER = [
  {
    title: "Close account",
    note: "`users.disabled_at` exists for disable, but there is no self-serve close route yet.",
    danger: true,
  },
] as const;

export type AccountSettingsComingSoonProps = {
  /** Optional read-only current email for the Email accordion (draft-v2). */
  primaryEmail?: string;
  /** Live Security accordions (Passkeys, Trusted devices) after TOTP, before Close. */
  securityAfterTotp?: ReactNode;
};

function connectionGroups(): Array<{
  group: string;
  providers: typeof CONNECTION_PROVIDERS;
}> {
  const groups: Array<{
    group: string;
    providers: (typeof CONNECTION_PROVIDERS)[number][];
  }> = [];
  for (const provider of CONNECTION_PROVIDERS) {
    const last = groups[groups.length - 1];
    if (last && last.group === provider.group) {
      last.providers.push(provider);
    } else {
      groups.push({ group: provider.group, providers: [provider] });
    }
  }
  return groups as Array<{
    group: string;
    providers: typeof CONNECTION_PROVIDERS;
  }>;
}

function SecuritySoonAccordion({
  item,
  primaryEmail,
}: {
  item: (typeof SECURITY_SOON_BEFORE)[number] | (typeof SECURITY_SOON_AFTER)[number];
  primaryEmail: string;
}) {
  return (
    <details
      className={
        item.danger
          ? "account-settings-acc account-settings-acc--danger"
          : "account-settings-acc"
      }
    >
      <summary>
        <span className="account-settings-acc-heading">
          <span>{item.title}</span>
          <span className="account-settings-tag account-settings-tag--soon">
            Coming soon
          </span>
        </span>
      </summary>
      <div className="account-settings-acc-body">
        {item.title === "Email" ? (
          <div className="account-settings-field">
            <label htmlFor="account-current-email">Current (read-only)</label>
            <input
              className="account-settings-control"
              id="account-current-email"
              type="email"
              value={primaryEmail}
              readOnly
            />
          </div>
        ) : null}
        <p className="account-settings-soon-note">{item.note}</p>
      </div>
    </details>
  );
}

export function AccountSettingsComingSoon({
  primaryEmail = "",
  securityAfterTotp,
}: AccountSettingsComingSoonProps) {
  return (
    <>
      <section
        className="account-settings-card"
        aria-labelledby="account-connections-heading"
      >
        <h2 id="account-connections-heading">Connections</h2>
        <p className="account-settings-soon-note account-settings-soon-note--section">
          {CONNECTIONS_SOON_NOTE}
        </p>
        <div className="account-settings-connections">
          {connectionGroups().map(({ group, providers }) => (
            <div key={group}>
              <div className="account-settings-conn-group">{group}</div>
              {providers.map((provider) => (
                <div
                  key={provider.name}
                  className="account-settings-conn account-settings-conn--soon"
                >
                  <div
                    className={`account-settings-conn-mark account-settings-conn-mark--${provider.mark}`}
                    aria-hidden="true"
                  >
                    {provider.label}
                  </div>
                  <div className="account-settings-conn-meta">
                    <strong>{provider.name}</strong>
                    <span>{provider.off}</span>
                  </div>
                  <span className="account-settings-tag account-settings-tag--soon">
                    Soon
                  </span>
                  <button
                    type="button"
                    className="portal-btn portal-btn--ghost account-settings-conn-btn"
                    disabled
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section
        className="account-settings-card"
        aria-labelledby="account-security-heading"
      >
        <h2 id="account-security-heading">Security</h2>
        {SECURITY_SOON_BEFORE.map((item) => (
          <SecuritySoonAccordion
            key={item.title}
            item={item}
            primaryEmail={primaryEmail}
          />
        ))}
        {securityAfterTotp}
        {SECURITY_SOON_AFTER.map((item) => (
          <SecuritySoonAccordion
            key={item.title}
            item={item}
            primaryEmail={primaryEmail}
          />
        ))}
      </section>
    </>
  );
}
