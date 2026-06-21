"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AccountAccessPanel } from "@/src/features/account/components/account-access-panel";
import {
  type AccountApiClient,
  type AccountSession,
} from "./api-client";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  type TripApiClient,
} from "@/src/trip/api-client";
import {
  createConfiguredAccountApiClient,
  createConfiguredTripApiClient,
} from "@/src/api/sagittarius-api-clients";
import { persistParticipantSession } from "@/src/trip/auth";
import type { TripParticipantSession } from "@/src/trip/types";
import {
  loadPersistedAccountSession,
  persistAccountSession,
} from "./session-storage";
import type { PortalSection } from "@/src/shared/portal";

export type AccountAppAccessMode =
  | "account-login"
  | "account-register"
  | "account-portal";

export type AccountAppPortalSection =
  PortalSection;

interface AccountAppProps {
  accessMode: AccountAppAccessMode;
  accountClient?: AccountApiClient;
  accountSuccessRedirectHref?: string;
  apiClient?: TripApiClient;
  portalSection?: AccountAppPortalSection;
}

export function AccountApp({
  accessMode,
  accountClient,
  accountSuccessRedirectHref,
  apiClient,
  portalSection = "dashboard",
}: AccountAppProps) {
  const resolvedAccountClient = useMemo(
    () =>
      accountClient ?? createConfiguredAccountApiClient(),
    [accountClient],
  );
  const resolvedApiClient = useMemo(
    () =>
      apiClient ?? createConfiguredTripApiClient(),
    [apiClient],
  );
  const [accountSession, setAccountSession] = useState<AccountSession | null>(
    null,
  );
  const [accountSessionLoaded, setAccountSessionLoaded] = useState(false);

  useEffect(() => {
    if (accountSessionLoaded) return;
    const timeout = window.setTimeout(() => {
      setAccountSession(loadPersistedAccountSession());
      setAccountSessionLoaded(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [accountSessionLoaded]);

  useEffect(() => {
    if (!accountSessionLoaded) return;
    persistAccountSession(accountSession);
  }, [accountSession, accountSessionLoaded]);

  const changeAccountSession = useCallback((session: AccountSession | null) => {
    setAccountSession(session);
    persistAccountSession(session);
  }, []);

  const openTripWorkspace = useCallback((session: TripParticipantSession) => {
    persistParticipantSession(session);
    if (typeof window === "undefined") return;
    window.location.assign(appRoutes.tripOverview(session.tripId));
  }, []);
  const ignoreTripChange = useCallback(() => undefined, []);

  return (
    <AccountAccessPanel
      accessMode={accessMode}
      accountClient={resolvedAccountClient}
      accountSession={accountSession}
      accountSessionLoaded={accountSessionLoaded}
      accountSuccessRedirectHref={accountSuccessRedirectHref}
      apiClient={resolvedApiClient}
      portalSection={portalSection}
      onAccountSessionChange={changeAccountSession}
      onAuthenticated={openTripWorkspace}
      onTripChange={ignoreTripChange}
    />
  );
}
