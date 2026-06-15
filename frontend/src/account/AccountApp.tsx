"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AccountAccessPanel } from "@/src/components/AccountAccessPanel";
import {
  createAccountApiClient,
  type AccountApiClient,
  type AccountSession,
} from "./api-client";
import { appRoutes } from "@/src/routes/app-routes";
import {
  createTripApiClient,
  type TripApiClient,
} from "@/src/trip/api-client";
import { persistParticipantSession } from "@/src/trip/participant-session-storage";
import type { TripParticipantSession } from "@/src/trip/types";
import {
  loadPersistedAccountSession,
  persistAccountSession,
} from "./session-storage";

export type AccountAppAccessMode =
  | "account-login"
  | "account-register"
  | "account-portal";

export type AccountAppPortalSection =
  | "dashboard"
  | "trips"
  | "new-trip"
  | "explorer"
  | "todos"
  | "vault"
  | "settings"
  | "sign-out";

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
      accountClient ??
      createAccountApiClient({
        baseUrl: process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL ?? "",
      }),
    [accountClient],
  );
  const resolvedApiClient = useMemo(
    () =>
      apiClient ??
      createTripApiClient({
        baseUrl: process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL ?? "",
      }),
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
