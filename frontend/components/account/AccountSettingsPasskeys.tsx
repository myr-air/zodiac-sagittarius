"use client";

import { useEffect, useRef, useState } from "react";
import type { PasskeySummary } from "@/src/account/account-api";
import {
  deletePasskey,
  fetchAccountSettings,
} from "@/src/account/account-api";
import { registerPasskey } from "@/src/account/passkey-register";
import { defaultApiBaseUrl } from "@/src/auth/email-challenge";

const EMPTY_PASSKEYS = "No passkeys yet.";
const ADD_PASSKEY_LABEL = "Add passkey";
const REMOVE_LABEL = "Remove";
const CANCEL_LABEL = "Cancel";
const REMOVE_DIALOG_TITLE = "Remove passkey?";
const REMOVE_DIALOG_LEDE = "This passkey will no longer sign you in.";
const PASSKEYS_HINT =
  "Remove asks for confirmation before deleting the passkey.";
const REMOVE_DIALOG_TITLE_ID = "passkey-remove-dialog-title";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

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

function getFocusable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

export function AccountSettingsPasskeys({
  passkeys,
  sessionToken,
  onPasskeysChange,
}: AccountSettingsPasskeysProps) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  function openRemoveDialog(passkeyId: string, trigger: HTMLElement) {
    restoreFocusRef.current = trigger;
    setError(null);
    setPendingRemoveId(passkeyId);
  }

  function closeRemoveDialog() {
    setPendingRemoveId(null);
  }

  useEffect(() => {
    if (pendingRemoveId == null) return;

    const panel = dialogRef.current;
    const cancel = cancelRef.current;
    if (!panel || !cancel) return;

    cancel.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRemoveDialog();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const list = getFocusable(panel);
      if (!list.length) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const restore = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (restore && typeof restore.focus === "function") {
        restore.focus();
      }
    };
  }, [pendingRemoveId]);

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

  async function handleRemove(passkeyId: string) {
    if (removingId) return;

    setRemovingId(passkeyId);
    setError(null);
    try {
      const outcome = await deletePasskey(
        { sessionToken, passkeyId },
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
    } finally {
      setRemovingId(null);
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
        <p className="account-settings-hint">{PASSKEYS_HINT}</p>

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
                  disabled={removingId === pk.id}
                  onClick={(e) => openRemoveDialog(pk.id, e.currentTarget)}
                >
                  {REMOVE_LABEL}
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

      {pendingRemoveId != null ? (
        <div className="account-settings-dialog-root">
          <div
            className="account-settings-dialog-backdrop"
            onClick={closeRemoveDialog}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={REMOVE_DIALOG_TITLE_ID}
            className="account-settings-dialog"
          >
            <h3 id={REMOVE_DIALOG_TITLE_ID}>{REMOVE_DIALOG_TITLE}</h3>
            <p className="account-settings-soon-note">{REMOVE_DIALOG_LEDE}</p>
            <div className="account-settings-dialog-actions">
              <button
                ref={cancelRef}
                type="button"
                className="portal-btn portal-btn--ghost"
                onClick={closeRemoveDialog}
              >
                {CANCEL_LABEL}
              </button>
              <button
                type="button"
                className="portal-btn portal-btn--primary"
                disabled={removingId === pendingRemoveId}
                onClick={() => {
                  const id = pendingRemoveId;
                  closeRemoveDialog();
                  void handleRemove(id);
                }}
              >
                {REMOVE_LABEL}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </details>
  );
}
