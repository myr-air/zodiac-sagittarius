import { StatusMessage } from "../auth";
import { accountToastStackClassName } from "../layout/account-access-panel-layout";

interface AccountAccessStatusStackProps {
  displayError: string | null;
  isAccountEntry: boolean;
  message: string | null;
}

export function AccountAccessStatusStack({
  displayError,
  isAccountEntry,
  message,
}: AccountAccessStatusStackProps) {
  if (isAccountEntry && message) {
    return (
      <div className={accountToastStackClassName} aria-live="polite">
        <StatusMessage tone="success">{message}</StatusMessage>
      </div>
    );
  }

  return (
    <>
      {!isAccountEntry && message ? (
        <StatusMessage tone="success">{message}</StatusMessage>
      ) : null}
      {!isAccountEntry && displayError ? (
        <StatusMessage tone="danger">{displayError}</StatusMessage>
      ) : null}
    </>
  );
}
