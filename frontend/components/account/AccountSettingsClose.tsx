"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { closeAccount } from "@/src/account/account-api";
import { ACCOUNT_SESSION_STORAGE_KEY } from "@/src/auth/account-session";
import { defaultApiBaseUrl } from "@/src/auth/email-challenge";

const CLOSE_ACCORDION_TITLE = "Close account";
const CLOSE_OPEN_LABEL = "Close account…";
const CLOSE_DIALOG_TITLE = "Close account?";
const CLOSE_PASSWORD_LABEL = "Password";
const CLOSE_CONFIRM_LABEL = "Confirmation";
const CLOSE_CONFIRM_VALUE = "CLOSE";
const CLOSE_CONFIRM_BUTTON = "Close account";
const CANCEL_LABEL = "Cancel";
const CLOSE_DANGER_CALLOUT =
  "This disables your account and signs you out everywhere. Trip data is not hard-deleted — transfer ownership of trips you own first when needed.";
const CLOSE_DIALOG_LEDE =
  "This disables your account and ends all sessions. Trip data is not hard-deleted — transfer ownership of trips you own first. Type CLOSE to confirm.";
const CLOSE_DIALOG_TITLE_ID = "account-close-dialog-title";
const NO_SESSION_ERROR = "Session is missing or invalid.";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export type AccountSettingsCloseProps = {
  sessionToken?: string | null;
};

function getFocusable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

export function AccountSettingsClose({
  sessionToken,
}: AccountSettingsCloseProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const canConfirm =
    password.length > 0 && confirmation === CLOSE_CONFIRM_VALUE && !submitting;

  function openDialog(trigger: HTMLElement) {
    restoreFocusRef.current = trigger;
    setPassword("");
    setConfirmation("");
    setError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setPassword("");
    setConfirmation("");
    setError(null);
  }

  useEffect(() => {
    if (!dialogOpen) return;

    const panel = dialogRef.current;
    const cancel = cancelRef.current;
    if (!panel || !cancel) return;

    cancel.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog();
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
  }, [dialogOpen]);

  async function handleClose() {
    if (!canConfirm || submitting) return;
    if (!sessionToken) {
      setError(NO_SESSION_ERROR);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const outcome = await closeAccount(
        {
          sessionToken,
          password,
          confirmation,
        },
        { fetch, apiBaseUrl: defaultApiBaseUrl() },
      );
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }

      try {
        window.localStorage.removeItem(ACCOUNT_SESSION_STORAGE_KEY);
      } catch {
        // ignore quota / private mode
      }
      closeDialog();
      router.replace("/login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <details className="account-settings-acc account-settings-acc--danger">
      <summary>
        <span className="account-settings-acc-heading">
          <span>{CLOSE_ACCORDION_TITLE}</span>
        </span>
      </summary>
      <div className="account-settings-acc-body">
        <p className="account-settings-danger-callout">{CLOSE_DANGER_CALLOUT}</p>
        <button
          type="button"
          className="portal-btn portal-btn--danger"
          onClick={(e) => openDialog(e.currentTarget)}
        >
          {CLOSE_OPEN_LABEL}
        </button>
        {error && !dialogOpen ? (
          <p role="alert" className="text-sm text-(--color-danger)">
            {error}
          </p>
        ) : null}
      </div>

      {dialogOpen ? (
        <div className="account-settings-dialog-root">
          <div
            className="account-settings-dialog-backdrop"
            onClick={closeDialog}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={CLOSE_DIALOG_TITLE_ID}
            className="account-settings-dialog account-settings-dialog--danger"
          >
            <h3 id={CLOSE_DIALOG_TITLE_ID}>{CLOSE_DIALOG_TITLE}</h3>
            <p className="account-settings-soon-note">{CLOSE_DIALOG_LEDE}</p>

            <div className="account-settings-field">
              <label htmlFor="account-close-password">
                {CLOSE_PASSWORD_LABEL}
              </label>
              <input
                className="account-settings-control"
                id="account-close-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="account-settings-field">
              <label htmlFor="account-close-confirmation">
                {CLOSE_CONFIRM_LABEL}
              </label>
              <input
                className="account-settings-control"
                id="account-close-confirmation"
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                placeholder={CLOSE_CONFIRM_VALUE}
              />
            </div>

            {error ? (
              <p role="alert" className="text-sm text-(--color-danger)">
                {error}
              </p>
            ) : null}

            <div className="account-settings-dialog-actions">
              <button
                ref={cancelRef}
                type="button"
                className="portal-btn portal-btn--ghost"
                onClick={closeDialog}
              >
                {CANCEL_LABEL}
              </button>
              <button
                type="button"
                className="portal-btn portal-btn--danger"
                disabled={!canConfirm}
                onClick={() => void handleClose()}
              >
                {CLOSE_CONFIRM_BUTTON}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </details>
  );
}
