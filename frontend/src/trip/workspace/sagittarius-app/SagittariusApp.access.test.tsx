import {
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SagittariusApp,
} from "@/src/app/SagittariusApp";
import { seedTrip } from "@/src/trip/seed";
import {
  appRoutes,
  encodeReturnTo,
} from "@/src/trip/workspace/sagittarius-app/support";
import {
  createApiClientForTrip,
  installLocalStorageStub,
  mockWindowLocation,
  persistTripParticipantSession,
  render,
  renderApiTripAccessSagittariusApp,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit access", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("can require trip participant authentication before opening the cockpit", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp requireJoin />);

    expect(
      screen.getByRole("main", { name: /Account access/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Trip ID/i), {
      target: { value: "HK-SZ-2025" },
    });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
      target: { value: "seed-trip-pass" },
    });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), {
      target: { value: "traveler-pin" },
    });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    expect(
      await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i })
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("region", { name: /Trip overview/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryAllByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }),
    ).toHaveLength(0);
  }, 45_000);

  it("keeps account routes isolated from restored local participant sessions", async () => {
    const storage = installLocalStorageStub();
    persistTripParticipantSession(storage, {
      memberId: seedTrip.members[1].id,
      sessionToken: "local-restored-session",
    });

    render(<SagittariusApp accessMode="account-login" requireJoin />);

    expect(
      await screen.findByRole("main", { name: /Account sign in/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Travel ideas. Perfectly planned./i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).not.toBeInTheDocument();
  });

  it("uses the API join route for canonical API trip access and replaces join history", async () => {
    const user = userEvent.setup();
    const replaceStateMock = vi
      .spyOn(window.history, "replaceState")
      .mockImplementation(() => undefined);
    const safeReturnTo = appRoutes.tripItinerary(seedTrip.id);
    const { locationSpy } = mockWindowLocation({
      pathname: appRoutes.join(),
      search: `?rt=${encodeURIComponent(encodeReturnTo(safeReturnTo))}`,
    });
    const apiClient = createApiClientForTrip(seedTrip);
    renderApiTripAccessSagittariusApp({ apiClient });

    fireEvent.change(screen.getByLabelText(/Trip ID/i), {
      target: { value: "HK-SZ-2025" },
    });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
      target: { value: "seed-trip-pass" },
    });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), {
      target: { value: "traveler-pin" },
    });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    expect(apiClient.joinTrip).toHaveBeenCalledWith({
      joinId: "HK-SZ-2025",
      password: "seed-trip-pass",
    });
    expect(apiClient.loadTrip).toHaveBeenCalledWith(
      seedTrip.id,
      "session-token",
    );
    expect(replaceStateMock).toHaveBeenCalledWith(null, "", safeReturnTo);
    expect(
      screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).toBeInTheDocument();

    locationSpy.mockRestore();
    replaceStateMock.mockRestore();
  }, 45_000);

  it.each([
    ["overview", appRoutes.tripOverview(seedTrip.id)],
    ["itinerary", appRoutes.tripItinerary(seedTrip.id)],
    ["map", appRoutes.tripMap(seedTrip.id)],
    ["timeline", appRoutes.tripTimeline(seedTrip.id)],
    ["members", appRoutes.tripMembers(seedTrip.id)],
    ["settings", appRoutes.tripSettings(seedTrip.id)],
  ] as const)(
    "redirects unauthenticated trip %s routes to /join with encoded returnTo",
    async (_view, tripPath) => {
      const { locationSpy, replaceMock } = mockWindowLocation({
        pathname: tripPath,
        search: "",
      });

      renderApiTripAccessSagittariusApp({ routeTripId: seedTrip.id });

      await waitFor(() =>
        expect(replaceMock).toHaveBeenCalledWith(
          appRoutes.join(undefined, tripPath),
        ),
      );
      expect(
        screen.queryByRole("heading", { name: /เข้าห้อง trip/i }),
      ).not.toBeInTheDocument();

      locationSpy.mockRestore();
    },
  );

});
