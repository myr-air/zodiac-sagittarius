import { useEffect, useState } from "react";
import type {
  AccountApiClient,
  AccountSession,
} from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import {
  clearAccountPortalDataCache,
  isAccountEntryMode,
  type AccountAccessMode,
} from "./account-access-panel-support";
import {
  localizeAccessError,
  type AuthFlow,
} from "./auth";
import { useAccountPortalData } from "./portal";

type AccessMode = "account" | "temp";

interface UseAccountAccessPanelStateArgs {
  accessMessages: Messages["access"]["messages"];
  accessMode: AccountAccessMode;
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  accountSuccessRedirectHref?: string;
  initialError?: string | null;
  onAccountSessionChange: (session: AccountSession | null) => void;
}

export type UseAccountAccessPanelState = ReturnType<typeof useAccountAccessPanelState>;

export function useAccountAccessPanelState({
  accessMessages,
  accessMode,
  accountClient,
  accountSession,
  accountSuccessRedirectHref,
  initialError,
  onAccountSessionChange,
}: UseAccountAccessPanelStateArgs) {
  const [clientPortalRedirected, setClientPortalRedirected] = useState(false);
  const effectiveAccessMode: AccountAccessMode = clientPortalRedirected ? "account-portal" : accessMode;
  const [entryFlowOverride, setEntryFlowOverride] = useState<AuthFlow | null>(null);
  const entryFlow = entryFlowOverride ?? (accessMode === "account-register" ? "register" : "login");
  const effectiveEntryAccessMode: AccountAccessMode = isAccountEntryMode(effectiveAccessMode)
    ? entryFlow === "register" ? "account-register" : "account-login"
    : effectiveAccessMode;
  const forcedMode = effectiveAccessMode === "trip-access" ? "temp" : effectiveAccessMode === "combined" ? null : "account";
  const isAccountEntry = effectiveAccessMode === "account-login" || effectiveAccessMode === "account-register";
  const isPortalEntry = effectiveAccessMode === "account-portal";
  const isTripAccessEntry = effectiveAccessMode === "trip-access";
  const [selectedMode, setSelectedMode] = useState<AccessMode>(() => (accountSession ? "account" : "temp"));
  const mode = forcedMode ?? (accountSession ? "account" : selectedMode);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAccountSession, setPendingAccountSession] =
    useState<AccountSession | null>(null);
  const displayError = error
    ? localizeAccessError(error, accessMessages) ?? error
    : localizeAccessError(initialError ?? null, accessMessages);
  const portalData = useAccountPortalData({
    accountClient,
    accountSession,
    isAccountEntry,
    onAccountSessionChange,
    onError: setError,
  });

  useEffect(() => {
    if (!pendingAccountSession) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      onAccountSessionChange(pendingAccountSession);
      if (accountSuccessRedirectHref) {
        if (pendingAccountSession.kind === "trusted") {
          window.location.replace(accountSuccessRedirectHref);
        } else {
          window.history.replaceState(null, "", accountSuccessRedirectHref);
          setClientPortalRedirected(true);
        }
      }
      setPendingAccountSession(null);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [accountSuccessRedirectHref, onAccountSessionChange, pendingAccountSession]);

  function clearPortalSession(sessionToken: string) {
    clearAccountPortalDataCache(sessionToken);
    onAccountSessionChange(null);
  }

  function handleLoggedIn(session: AccountSession, messages: {
    temporaryLogin: string;
    trustedLogin: string;
  }) {
    setMessage(
      session.kind === "trusted"
        ? messages.trustedLogin
        : messages.temporaryLogin,
    );
    setPendingAccountSession(session);
  }

  return {
    ...portalData,
    clearPortalSession,
    displayError,
    effectiveAccessMode,
    effectiveEntryAccessMode,
    entryFlow,
    handleLoggedIn,
    isAccountEntry,
    isPortalEntry,
    isTripAccessEntry,
    message,
    mode,
    pendingAccountSession,
    setEntryFlowOverride,
    setError,
    setMessage,
    setSelectedMode,
  };
}
