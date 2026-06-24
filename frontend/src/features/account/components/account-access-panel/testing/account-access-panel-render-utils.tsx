import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, vi } from "vitest";
import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import type { PortalSection } from "@/src/shared/portal";
import type { TripApiClient } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { AccountAccessPanel } from "../AccountAccessPanel";
import type { AccountAccessMode } from "../model/account-access-modes";
import { render } from "./account-access-panel-render-base";
import { createAccountClient } from "./account-access-panel-test-clients";
export { render } from "./account-access-panel-render-base";
export { renderTripBuilder } from "./account-access-panel-trip-builder-render";

export function authForm() {
  const form = screen.getByLabelText(/Email/i).closest("form");
  expect(form).toBeTruthy();
  return within(form as HTMLElement);
}

export function fillAccountPasswordFields(
  email: string,
  password: string,
) {
  fireEvent.change(screen.getByLabelText(/Email/i), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/^Password$/i), {
    target: { value: password },
  });
}

export async function switchToThai(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Language and currency/i }));
  await user.click(await screen.findByRole("menuitemradio", { name: /ภาษาไทย/i }));
}

export async function selectDestinationCity(user: ReturnType<typeof userEvent.setup>, query: string, option: RegExp) {
  const search = await screen.findByLabelText(/Search destination cities/i);
  await user.clear(search);
  await user.type(search, query);
  await user.click(await screen.findByRole("button", { name: option }));
}

export function AccountHarness({
  accountClient,
  onAuthenticated,
}: {
  accountClient: AccountApiClient;
  onAuthenticated: (session: TripParticipantSession) => void;
}) {
  const [accountSession, setAccountSession] = useState<AccountSession | null>(null);

  return (
    <AccountAccessPanel
      accountClient={accountClient}
      accountSession={accountSession}
      trip={seedTrip}
      onAccountSessionChange={setAccountSession}
      onAuthenticated={onAuthenticated}
      onTripChange={vi.fn()}
    />
  );
}

export function renderAccountAccessPanel({
  accessMode,
  accountClient = createAccountClient(),
  accountSession = null,
  apiClient,
  initialError,
  initialJoinCode,
  initialJoinToken,
  onAccountSessionChange = vi.fn(),
  onAuthenticated = vi.fn(),
  onCockpitLoaded,
  onTripChange = vi.fn(),
  portalSection,
  trip = seedTrip,
}: {
  accessMode?: AccountAccessMode;
  accountClient?: AccountApiClient;
  accountSession?: AccountSession | null;
  apiClient?: TripApiClient;
  initialError?: string | null;
  initialJoinCode?: string;
  initialJoinToken?: string | null;
  onAccountSessionChange?: (session: AccountSession | null) => void;
  onAuthenticated?: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: Awaited<ReturnType<TripApiClient["loadTrip"]>>) => void;
  onTripChange?: (trip: Trip) => void;
  portalSection?: PortalSection;
  trip?: Trip;
} = {}) {
  const result = render(
    <AccountAccessPanel
      accessMode={accessMode}
      accountClient={accountClient}
      accountSession={accountSession}
      apiClient={apiClient}
      initialError={initialError}
      initialJoinCode={initialJoinCode}
      initialJoinToken={initialJoinToken}
      portalSection={portalSection}
      trip={trip}
      onAccountSessionChange={onAccountSessionChange}
      onAuthenticated={onAuthenticated}
      onCockpitLoaded={onCockpitLoaded}
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
