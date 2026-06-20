import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, useState } from "react";
import { expect, vi } from "vitest";
import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
export { installLocalStorageStub } from "@/src/testing/browser-storage";
import type { TripApiClient } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import type { PortalSection } from "@/src/shared/portal";
import { AccountAccessPanel } from "../AccountAccessPanel";
import type { AccountAccessMode } from "../account-access-panel-support";
import { createAccountClient, createTrustedAccountSession } from "./account-access-panel-test-clients";

export * from "./account-access-panel-test-clients";
export * from "./account-access-panel-passkey-test-utils";

export function render(ui: ReactElement) {
  const result = renderWithI18n(ui, { locale: "en" });
  const originalRerender = result.rerender;

  return {
    ...result,
    rerender: (nextUi: ReactElement) => originalRerender(<I18nProvider>{nextUi}</I18nProvider>),
  };
}

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
