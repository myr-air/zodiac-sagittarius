/**
 * Account settings Coming soon — Connections + Security chrome (draft-v4).
 * Password and Close account are live. Passkeys (T5) / Trusted devices (T6)
 * slot in via `securityAfterTotp` (after Email/Password/TOTP, before Close).
 * Connections / Email / TOTP stay compact Coming soon stubs (no OAuth / email / TOTP API).
 */

import type { ReactNode } from "react";
import { AccountSettingsClose } from "@/components/account/AccountSettingsClose";
import { AccountSettingsPassword } from "@/components/account/AccountSettingsPassword";

const CONNECTIONS_STUB_HEADING = "Google Drive, Photos, and social accounts";
const CONNECTIONS_STUB_BODY =
  "Connect libraries and social accounts later. Trip album links can still use Google providers as URLs today.";

/** Coming soon summary-only rows before live Password / Passkeys / Trusted devices. */
const SECURITY_SOON_TITLES = ["Email", "Two-factor (TOTP)"] as const;

export type AccountSettingsComingSoonProps = {
  /** Reserved for future Email accordion; ignored while summary-only (draft-v4). */
  primaryEmail?: string;
  /** Session token for the live Password change form. */
  sessionToken?: string | null;
  /** Live Security accordions (Passkeys, Trusted devices) after TOTP, before Close. */
  securityAfterTotp?: ReactNode;
};

function SecuritySoonAccordion({ title }: { title: string }) {
  return (
    <details className="account-settings-acc">
      <summary>
        <span className="account-settings-acc-heading">
          <span>{title}</span>
          <span className="account-settings-tag account-settings-tag--soon">
            Coming soon
          </span>
        </span>
      </summary>
    </details>
  );
}

export function AccountSettingsComingSoon({
  sessionToken,
  securityAfterTotp,
}: AccountSettingsComingSoonProps) {
  return (
    <>
      <section
        className="account-settings-card"
        aria-labelledby="account-connections-heading"
      >
        <h2 id="account-connections-heading">
          Connections{" "}
          <span className="account-settings-tag account-settings-tag--soon">
            Coming soon
          </span>
        </h2>
        <div className="account-settings-conn-stub">
          <strong>{CONNECTIONS_STUB_HEADING}</strong>
          {CONNECTIONS_STUB_BODY}
        </div>
      </section>

      <section
        className="account-settings-card"
        aria-labelledby="account-security-heading"
      >
        <h2 id="account-security-heading">Security</h2>
        <SecuritySoonAccordion title={SECURITY_SOON_TITLES[0]} />
        <AccountSettingsPassword sessionToken={sessionToken} />
        <SecuritySoonAccordion title={SECURITY_SOON_TITLES[1]} />
        {securityAfterTotp}
        <AccountSettingsClose sessionToken={sessionToken} />
      </section>
    </>
  );
}
