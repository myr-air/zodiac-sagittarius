"use client";

import { useState } from "react";
import { changePassword } from "@/src/account/account-api";
import { defaultApiBaseUrl } from "@/src/auth/email-challenge";

const CURRENT_PASSWORD_LABEL = "Current password";
const NEW_PASSWORD_LABEL = "New password";
const CONFIRM_PASSWORD_LABEL = "Confirm new password";
const UPDATE_PASSWORD_LABEL = "Update password";
const PASSWORD_HINT = "Uses a separate Update action. Minimum 8 characters.";
const NO_SESSION_ERROR = "Session is missing or invalid.";

export type AccountSettingsPasswordProps = {
  sessionToken?: string | null;
};

export function AccountSettingsPassword({
  sessionToken,
}: AccountSettingsPasswordProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleUpdate() {
    if (submitting) return;
    if (!sessionToken) {
      setError(NO_SESSION_ERROR);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const outcome = await changePassword(
        {
          sessionToken,
          currentPassword,
          newPassword,
        },
        { fetch, apiBaseUrl: defaultApiBaseUrl() },
      );
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <details className="account-settings-acc">
      <summary>
        <span className="account-settings-acc-heading">
          <span>Password</span>
        </span>
      </summary>
      <div className="account-settings-acc-body">
        <p className="account-settings-hint">{PASSWORD_HINT}</p>

        <div className="account-settings-field">
          <label htmlFor="account-current-password">
            {CURRENT_PASSWORD_LABEL}
          </label>
          <input
            className="account-settings-control"
            id="account-current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div className="account-settings-field">
          <label htmlFor="account-new-password">{NEW_PASSWORD_LABEL}</label>
          <input
            className="account-settings-control"
            id="account-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="account-settings-field">
          <label htmlFor="account-confirm-password">
            {CONFIRM_PASSWORD_LABEL}
          </label>
          <input
            className="account-settings-control"
            id="account-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button
          type="button"
          className="portal-btn portal-btn--primary"
          disabled={submitting}
          onClick={() => void handleUpdate()}
        >
          {UPDATE_PASSWORD_LABEL}
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
