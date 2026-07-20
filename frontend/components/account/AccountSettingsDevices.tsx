"use client";

import { useState } from "react";
import type { TrustedDeviceSummary } from "@/src/account/account-api";
import {
  fetchAccountSettings,
  revokeTrustedDevice,
} from "@/src/account/account-api";
import { defaultApiBaseUrl } from "@/src/auth/email-challenge";

const EMPTY_DEVICES = "No trusted devices.";
const REVOKE_LABEL = "Revoke";
const DEVICES_HINT =
  "Revoke uses existing DELETE /account/trusted-devices/{id}.";

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

export function AccountSettingsDevices({
  trustedDevices,
  sessionToken,
  onTrustedDevicesChange,
}: AccountSettingsDevicesProps) {
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

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
        <p className="account-settings-soon-note">{DEVICES_HINT}</p>

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
                  onClick={() => void handleRevoke(device.id)}
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
    </details>
  );
}
