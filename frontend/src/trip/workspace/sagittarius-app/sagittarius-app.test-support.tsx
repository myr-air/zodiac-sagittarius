import {
  fireEvent,
  screen,
} from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";

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
  apiTripWithPlans,
  dailyBriefingFixture,
  tripWithPlans,
  tripWithPlansAndPlanScopedRecords,
} from "./sagittarius-app.test-fixtures";

export {
  installLocalStorageStub,
  installSessionStorageStub,
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
