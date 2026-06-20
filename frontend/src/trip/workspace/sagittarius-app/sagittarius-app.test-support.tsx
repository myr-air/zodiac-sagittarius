import {
  fireEvent,
  screen,
} from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { appRoutes } from "./support";
import {
  installLocalStorageStub,
  installSessionStorageStub,
} from "./sagittarius-app.test-storage";
import type { SagittariusAppProps } from "./types";

export {
  createApiClientForTrip,
  createDeferred,
} from "./sagittarius-app.test-api-client";

export {
  mockAccountPortalApiFetch,
  mockAccountTripMemberSessionFetch,
  mockRejectedAccountTripMemberSessionFetch,
} from "./sagittarius-app.test-account-api";

export {
  apiSeedTrip,
  apiTripWithPlans,
  dailyBriefingFixture,
  tripWithPlans,
  tripWithPlansAndPlanScopedRecords,
} from "./sagittarius-app.test-fixtures";

export {
  installLocalStorageStub,
  installSessionStorageStub,
  loadPersistedTripDraft,
  persistAccountSession,
  persistTripDraft,
  persistTripParticipantSession,
  persistTrustedAccountSession,
} from "./sagittarius-app.test-storage";

export function render(ui: ReactElement) {
  const result = renderWithI18n(ui, { locale: "th" });
  const originalRerender = result.rerender;

  return {
    ...result,
    rerender: (nextUi: ReactElement) =>
      originalRerender(
        <I18nProvider initialLocale="th">{nextUi}</I18nProvider>,
      ),
  };
}

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

export async function loginApiTrip(user: ReturnType<typeof userEvent.setup>) {
  fireEvent.change(screen.getByLabelText(/Trip ID/i), {
    target: { value: "HK-SZ-2025" },
  });
  fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
    target: { value: "seed-trip-pass" },
  });
  await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
  await user.click(
    await screen.findByRole("button", { name: /Demo Traveler/i }),
  );
  fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Demo Traveler/i), {
    target: { value: "owner-pin" },
  });
  await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
}

export async function renderApiSagittariusApp(
  user: ReturnType<typeof userEvent.setup>,
  props: Omit<SagittariusAppProps, "dataSource" | "requireJoin">,
) {
  const result = render(
    <SagittariusApp
      requireJoin
      dataSource="api"
      {...props}
    />,
  );
  await loginApiTrip(user);
  return result;
}

export function renderApiTripAccessSagittariusApp(
  props: Omit<SagittariusAppProps, "accessMode" | "dataSource" | "requireJoin">,
) {
  return render(
    <SagittariusApp
      accessMode="trip-access"
      requireJoin
      dataSource="api"
      {...props}
    />,
  );
}
