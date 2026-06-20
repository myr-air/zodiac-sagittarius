import {
  fireEvent,
  screen,
} from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { vi } from "vitest";
import type {
  AccountExplorerSummary,
  AccountTripStats,
  AccountTripSummary,
} from "@/src/account/api-client";
import { accountSessionStorageKey } from "@/src/account/session-storage";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { createMemoryStorage } from "@/src/testing/browser-storage";

export {
  createApiClientForTrip,
  createDeferred,
} from "./sagittarius-app.test-api-client";

export {
  dailyBriefingFixture,
  tripWithPlans,
  tripWithPlansAndPlanScopedRecords,
} from "./sagittarius-app.test-fixtures";

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

export function installLocalStorageStub() {
  const storage = createMemoryStorage();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

export function installSessionStorageStub() {
  const storage = createMemoryStorage();
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

export function persistTrustedAccountSession(
  storage: Pick<Storage, "setItem">,
  sessionToken = "playwright-account-session",
) {
  storage.setItem(
    accountSessionStorageKey,
    JSON.stringify({
      userId: "11111111-1111-1111-1111-111111111111",
      sessionToken,
      kind: "trusted",
      trustedDeviceId: "device-1",
      createdAt: "2026-05-30T10:00:00.000Z",
      expiresAt: "2030-01-01T10:00:00.000Z",
    }),
  );
}

export function mockAccountPortalApiFetch({
  trips = [],
  tripStats = {
    tripsTotal: trips.length,
    tripsOwned: trips.filter((trip) => trip.isOwner).length,
    activeTrips: trips.length,
    tempClaimsCompleted: 0,
  },
  explorer = {
    upcomingTrips: trips.length,
    ownedTrips: trips.filter((trip) => trip.isOwner).length,
    destinationCount: trips.length ? 1 : 0,
    nextTrip: null,
  },
}: {
  trips?: AccountTripSummary[];
  tripStats?: AccountTripStats;
  explorer?: AccountExplorerSummary;
} = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const request = input instanceof Request ? input.url : String(input);

    if (
      request.includes("/api/v1/account") &&
      !request.includes("/api/v1/account/trips") &&
      !request.includes("/api/v1/account/trip-stats")
    ) {
      return jsonResponse({
        profile: {
          id: "11111111-1111-1111-1111-111111111111",
          displayName: "Aom",
          avatarColor: "#0f766e",
          locale: "en-US",
          timezone: "UTC",
          primaryEmail: "aom@example.com",
        },
        passkeys: [],
        trustedDevices: [],
      });
    }

    if (request.includes("/api/v1/account/trips")) {
      return jsonResponse(trips);
    }

    if (request.includes("/api/v1/account/trip-stats")) {
      return jsonResponse(tripStats);
    }

    if (request.includes("/api/v1/account/explorer")) {
      return jsonResponse(explorer);
    }

    if (
      request.includes("/api/v1/account/to-dos") ||
      request.includes("/api/v1/account/vault")
    ) {
      return jsonResponse([]);
    }

    return jsonResponse({}, 404);
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
    statusText: status === 404 ? "not found" : undefined,
  });
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
