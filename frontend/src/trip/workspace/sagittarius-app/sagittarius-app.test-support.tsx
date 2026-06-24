import {
  screen,
} from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  installLocalStorageStub,
  installSessionStorageStub,
} from "@/src/testing/browser-storage";
import { appRoutes } from "@/src/routes/app-routes";
import {
  persistTripParticipantSession as persistTripParticipantSessionForApi,
} from "./testing/support/sagittarius-app-storage";

export {
  createApiClientForTrip,
  createDeferred,
} from "./testing/support/sagittarius-app-api-client";

export {
  mockAccountPortalApiFetch,
  mockAccountTripMemberSessionFetch,
  mockRejectedAccountTripMemberSessionFetch,
} from "./testing/support/sagittarius-app-account-api";

export {
  dailyBriefingFixture,
} from "./testing/fixtures/sagittarius-app-briefing-fixtures";

export {
  apiSeedTrip,
  apiTripWithPlans,
  tripWithPlans,
  tripWithPlansAndPlanScopedRecords,
} from "./testing/fixtures/sagittarius-app-plan-fixtures";

export {
  installLocalStorageStub,
  installSessionStorageStub,
} from "@/src/testing/browser-storage";

export {
  loginApiTrip,
  render,
  renderApiSagittariusApp,
  renderApiTripAccessSagittariusApp,
} from "./testing/support/sagittarius-app-render";

export {
  loadPersistedTripDraft,
  persistAccountSession,
  persistTripDraft,
  persistTripParticipantSession,
  persistTrustedAccountSession,
} from "./testing/support/sagittarius-app-storage";

export function resetSagittariusAppTestEnvironment() {
  installLocalStorageStub();
  installSessionStorageStub();
  window.history.pushState(null, "", appRoutes.home());
}

export function mockWindowLocation({
  pathname,
  search = "",
}: {
  pathname: string;
  search?: string;
}) {
  const replaceMock = vi.fn();
  const locationMock = {
    ...window.location,
    pathname,
    search,
    replace: replaceMock,
  };
  const locationSpy = vi
    .spyOn(window, "location", "get")
    .mockReturnValue(locationMock);

  return { locationMock, locationSpy, replaceMock };
}

export async function openItineraryHeaderControls(
  user: ReturnType<typeof userEvent.setup>,
) {
  const controlsButton = await screen.findByRole("button", {
    name: "Trip Plan controls",
  });
  await user.click(controlsButton);
  return controlsButton;
}

export function installApiSession(
  session: Parameters<typeof persistTripParticipantSessionForApi>[1] = {},
) {
  persistTripParticipantSessionForApi(window.sessionStorage, session);
}
