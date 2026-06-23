import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import type { Messages } from "@/src/i18n/messages";

export interface BuildAccountPortalDashboardHandlersOptions {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  apiClient?: TripApiClient;
  messages: Messages["access"];
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
  onTripChange: (trip: Trip) => void;
  state: {
    clearPortalSession: (sessionToken: string) => void;
    refreshAccount: (sessionToken: string) => Promise<void>;
    setMessage: (message: string | null) => void;
  };
}

export function buildAccountPortalDashboardHandlers({
  accountClient,
  accountSession,
  apiClient,
  messages,
  onAuthenticated,
  onCockpitLoaded,
  onTripChange,
  state,
}: BuildAccountPortalDashboardHandlersOptions) {
  return {
    onCreatedTrip: async (session: TripParticipantSession, options?: { openTrip?: boolean }) => {
      if (options?.openTrip !== false) {
        onAuthenticated(session);
        if (apiClient) {
          const cockpit = await apiClient.loadTrip(
            session.tripId,
            session.sessionToken,
          );
          onTripChange(cockpit.trip);
          onCockpitLoaded?.(cockpit);
        }
      }
      await state.refreshAccount(accountSession.sessionToken);
    },
    onLogout: async () => {
      await accountClient.logout(accountSession.sessionToken);
      state.clearPortalSession(accountSession.sessionToken);
      state.setMessage(messages.messages.loggedOut);
    },
    onSessionCleared: () => {
      state.clearPortalSession(accountSession.sessionToken);
    },
  };
}
