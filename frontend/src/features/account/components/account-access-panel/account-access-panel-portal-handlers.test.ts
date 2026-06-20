import { describe, expect, it, vi } from "vitest";
import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import type { TripApiClient } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { enMessages } from "@/src/i18n/messages/en";
import { buildAccountPortalDashboardHandlers } from "./account-access-panel-portal-handlers";

const accountSession: AccountSession = {
  createdAt: "2026-06-01T00:00:00.000Z",
  expiresAt: "2026-07-01T00:00:00.000Z",
  kind: "trusted",
  sessionToken: "account-session",
  trustedDeviceId: "trusted-device",
  userId: "user-1",
};

const memberSession: TripParticipantSession = {
  createdAt: "2026-06-01T00:00:00.000Z",
  expiresAt: "2026-07-01T00:00:00.000Z",
  memberId: "member-1",
  sessionToken: "trip-session",
  tripId: "trip-1",
};

const trip = {
  id: "trip-1",
  joinId: "0626-TYO-ABC",
  name: "Tokyo",
} as Trip;

function buildHandlers(options: Partial<Parameters<typeof buildAccountPortalDashboardHandlers>[0]> = {}) {
  const accountClient = {
    logout: vi.fn().mockResolvedValue(undefined),
  } as unknown as AccountApiClient;
  const state = {
    clearPortalSession: vi.fn(),
    refreshAccount: vi.fn().mockResolvedValue(undefined),
    setMessage: vi.fn(),
  };
  const apiClient = {
    loadTrip: vi.fn().mockResolvedValue({ trip }),
  } as unknown as TripApiClient;
  const onAuthenticated = vi.fn();
  const onCockpitLoaded = vi.fn();
  const onTripChange = vi.fn();

  return {
    accountClient,
    apiClient,
    handlers: buildAccountPortalDashboardHandlers({
      accountClient,
      accountSession,
      apiClient,
      messages: enMessages.access,
      onAuthenticated,
      onCockpitLoaded,
      onTripChange,
      state,
      ...options,
    }),
    onAuthenticated,
    onCockpitLoaded,
    onTripChange,
    state,
  };
}

describe("account portal dashboard handlers", () => {
  it("opens a created trip and refreshes account data by default", async () => {
    const { apiClient, handlers, onAuthenticated, onCockpitLoaded, onTripChange, state } = buildHandlers();

    await handlers.onCreatedTrip(memberSession);

    expect(onAuthenticated).toHaveBeenCalledWith(memberSession);
    expect(apiClient.loadTrip).toHaveBeenCalledWith("trip-1", "trip-session");
    expect(onTripChange).toHaveBeenCalledWith(trip);
    expect(onCockpitLoaded).toHaveBeenCalledWith({ trip });
    expect(state.refreshAccount).toHaveBeenCalledWith("account-session");
  });

  it("keeps the portal open when created trip options disable opening", async () => {
    const { apiClient, handlers, onAuthenticated, state } = buildHandlers();

    await handlers.onCreatedTrip(memberSession, { openTrip: false });

    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(apiClient.loadTrip).not.toHaveBeenCalled();
    expect(state.refreshAccount).toHaveBeenCalledWith("account-session");
  });

  it("logs out and clears the current portal session", async () => {
    const { accountClient, handlers, state } = buildHandlers();

    await handlers.onLogout();

    expect(accountClient.logout).toHaveBeenCalledWith("account-session");
    expect(state.clearPortalSession).toHaveBeenCalledWith("account-session");
    expect(state.setMessage).toHaveBeenCalledWith(enMessages.access.messages.loggedOut);
  });

  it("clears the current session when the portal reports a cleared session", () => {
    const { handlers, state } = buildHandlers();

    handlers.onSessionCleared();

    expect(state.clearPortalSession).toHaveBeenCalledWith("account-session");
  });
});
