"use client";

import { useState } from "react";
import type { PasskeySummary } from "@/src/account/account-api";
import { fetchAccountSettings } from "@/src/account/account-api";
import { registerPasskey } from "@/src/account/passkey-register";
import { defaultApiBaseUrl } from "@/src/auth/email-challenge";

const EMPTY_PASSKEYS = "No passkeys yet.";
const ADD_PASSKEY_LABEL = "Add passkey";
const PASSKEYS_HINT =
  "Add is live. Remove passkey is Coming soon (no DELETE route yet).";

export type AccountSettingsPasskeysProps = {
  passkeys: PasskeySummary[];
  sessionToken: string;
  /** Called after a successful add with the reloaded passkeys list. */
  onPasskeysChange: (passkeys: PasskeySummary[]) => void;
};

/** Absolute last-used label — UTC month/day/year (draft-v2). */
export function formatPasskeyLastUsed(lastUsedAt: string | null): string {
  if (!lastUsedAt) return "Never used";
  const d = new Date(lastUsedAt);
  const month = d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `Last used ${month} ${day}, ${year}`;
}

export function AccountSettingsPasskeys({
  passkeys,
  sessionToken,
  onPasskeysChange,
}: AccountSettingsPasskeysProps) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (adding) return;
    const trimmed = nickname.trim();
    if (!trimmed) return;

    setAdding(true);
    setError(null);
    try {
      const outcome = await registerPasskey(
        { sessionToken, nickname: trimmed },
        { fetch, apiBaseUrl: defaultApiBaseUrl() },
      );
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }

      const reloaded = await fetchAccountSettings(
        { sessionToken },
        { fetch, apiBaseUrl: defaultApiBaseUrl() },
      );
      if (!reloaded.ok) {
        setError(reloaded.error);
        return;
      }
      onPasskeysChange(reloaded.passkeys);
      setNickname("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <details className="account-settings-acc">
      <summary>
        <span className="account-settings-acc-heading">
          <span>Passkeys</span>
        </span>
      </summary>
      <div className="account-settings-acc-body">
        <p className="account-settings-soon-note">{PASSKEYS_HINT}</p>

        {passkeys.length === 0 ? (
          <p className="account-settings-soon-note">{EMPTY_PASSKEYS}</p>
        ) : (
          <ul className="account-settings-passkey-list">
            {passkeys.map((pk) => (
              <li key={pk.id} className="account-settings-passkey-row">
                <div className="account-settings-passkey-meta">
                  <strong>{pk.nickname}</strong>
                  <span>{formatPasskeyLastUsed(pk.lastUsedAt)}</span>
                </div>
                <button
                  type="button"
                  className="portal-btn portal-btn--ghost"
                  disabled
                  title="Coming soon"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="account-settings-field">
          <label htmlFor="account-passkey-nickname">Nickname</label>
          <input
            className="account-settings-control"
            id="account-passkey-nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="off"
          />
        </div>

        <button
          type="button"
          className="portal-btn portal-btn--primary"
          disabled={adding || !nickname.trim()}
          onClick={() => void handleAdd()}
        >
          {ADD_PASSKEY_LABEL}
        </button>

        {error ? (
          <p role="alert" className="text-sm text-(--color-danger)">
            {error}
          </p>
        ) : null}
      </div>
    </details>
  );
}
