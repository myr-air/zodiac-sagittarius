import { vi } from "vitest";
import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import type { TripApiClient } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { AccountAccessPanel } from "../AccountAccessPanel";
import { createAccountClient, createTrustedAccountSession } from "./account-access-panel-test-clients";
import { render } from "./account-access-panel-render-base";

export function renderTripBuilder({
  accountClient = createAccountClient(),
  apiClient,
  onAccountSessionChange = vi.fn(),
  onAuthenticated = vi.fn(),
  onTripChange = vi.fn(),
}: {
  accountClient?: AccountApiClient;
  apiClient?: TripApiClient;
  onAccountSessionChange?: (session: AccountSession | null) => void;
  onAuthenticated?: (session: TripParticipantSession) => void;
  onTripChange?: (trip: Trip) => void;
} = {}) {
  const result = render(
    <AccountAccessPanel
      accessMode="account-portal"
      accountClient={accountClient}
      apiClient={apiClient}
      accountSession={createTrustedAccountSession()}
      portalSection="new-trip"
      trip={seedTrip}
      onAccountSessionChange={onAccountSessionChange}
      onAuthenticated={onAuthenticated}
      onTripChange={onTripChange}
    />,
  );

  return {
    ...result,
    accountClient,
    onAccountSessionChange,
    onAuthenticated,
    onTripChange,
  };
}
