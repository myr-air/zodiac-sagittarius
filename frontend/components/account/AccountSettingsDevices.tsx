"use client";

import { useEffect, useRef, useState } from "react";
import type { TrustedDeviceSummary } from "@/src/account/account-api";
import {
  fetchAccountSettings,
  revokeTrustedDevice,
} from "@/src/account/account-api";
import { defaultApiBaseUrl } from "@/src/auth/email-challenge";

const EMPTY_DEVICES = "No trusted devices.";
const REVOKE_LABEL = "Revoke";
const CANCEL_LABEL = "Cancel";
const REVOKE_DIALOG_TITLE = "Revoke device?";
const REVOKE_DIALOG_LEDE = "This device will be signed out of Joii.";
const DEVICES_HINT =
  "Revoke asks for confirmation, same as removing a passkey.";
const REVOKE_DIALOG_TITLE_ID = "device-revoke-dialog-title";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export type AccountSettingsDevicesProps = {
  trustedDevices: TrustedDeviceSummary[];
  sessionToken: string;
  /** Called after a successful revoke with the reloaded devices list. */
  onTrustedDevicesChange: (trustedDevices: TrustedDeviceSummary[]) => void;
};

/** Absolute last-seen label — UTC month/day/year (draft-v2). */
export function formatDeviceLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "Never seen";
  const d = new Date(lastSeenAt);
  const month = d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `Last seen ${month} ${day}, ${year}`;
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

export function AccountSettingsDevices({
  trustedDevices,
  sessionToken,
  onTrustedDevicesChange,
}: AccountSettingsDevicesProps) {
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  function openRevokeDialog(trustedDeviceId: string, trigger: HTMLElement) {
    restoreFocusRef.current = trigger;
    setError(null);
    setPendingRevokeId(trustedDeviceId);
  }

  function closeRevokeDialog() {
    setPendingRevokeId(null);
  }

  useEffect(() => {
    if (pendingRevokeId == null) return;

    const panel = dialogRef.current;
    const cancel = cancelRef.current;
    if (!panel || !cancel) return;

    cancel.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRevokeDialog();
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
  }, [pendingRevokeId]);

  async function handleRevoke(trustedDeviceId: string) {
    if (revokingId) return;

    setRevokingId(trustedDeviceId);
    setError(null);
    try {
      const outcome = await revokeTrustedDevice(
        { sessionToken, trustedDeviceId },
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
      onTrustedDevicesChange(reloaded.trustedDevices);
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <details className="account-settings-acc">
      <summary>
        <span className="account-settings-acc-heading">
          <span>Trusted devices</span>
        </span>
      </summary>
      <div className="account-settings-acc-body">
        <p className="account-settings-hint">{DEVICES_HINT}</p>

        {trustedDevices.length === 0 ? (
          <p className="account-settings-soon-note">{EMPTY_DEVICES}</p>
        ) : (
          <ul className="account-settings-passkey-list">
            {trustedDevices.map((device) => (
              <li key={device.id} className="account-settings-passkey-row">
                <div className="account-settings-passkey-meta">
                  <strong>{device.label}</strong>
                  <span>{device.userAgent}</span>
                  <span>{formatDeviceLastSeen(device.lastSeenAt)}</span>
                </div>
                <button
                  type="button"
                  className="portal-btn portal-btn--ghost"
                  disabled={revokingId === device.id}
                  onClick={(e) => openRevokeDialog(device.id, e.currentTarget)}
                >
                  {REVOKE_LABEL}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error ? (
          <p role="alert" className="text-sm text-(--color-danger)">
            {error}
          </p>
        ) : null}
      </div>

      {pendingRevokeId != null ? (
        <div className="account-settings-dialog-root">
          <div
            className="account-settings-dialog-backdrop"
            onClick={closeRevokeDialog}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={REVOKE_DIALOG_TITLE_ID}
            className="account-settings-dialog"
          >
            <h3 id={REVOKE_DIALOG_TITLE_ID}>{REVOKE_DIALOG_TITLE}</h3>
            <p className="account-settings-soon-note">{REVOKE_DIALOG_LEDE}</p>
            <div className="account-settings-dialog-actions">
              <button
                ref={cancelRef}
                type="button"
                className="portal-btn portal-btn--ghost"
                onClick={closeRevokeDialog}
              >
                {CANCEL_LABEL}
              </button>
              <button
                type="button"
                className="portal-btn portal-btn--primary"
                disabled={revokingId === pendingRevokeId}
                onClick={() => {
                  const id = pendingRevokeId;
                  closeRevokeDialog();
                  void handleRevoke(id);
                }}
              >
                {REVOKE_LABEL}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </details>
  );
}
