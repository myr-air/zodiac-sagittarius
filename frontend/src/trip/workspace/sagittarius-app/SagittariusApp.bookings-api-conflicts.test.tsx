import {
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TripApiError } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import { createBookingDocThroughDialog } from "./sagittarius-app.test-booking-actions";
import {
  createApiClientForTrip,
  installApiSession,
  renderApiTripAccessSagittariusApp,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit bookings API conflicts", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("does not retry booking doc creates with a new mutation id after create conflicts", async () => {
    const user = userEvent.setup();
    installApiSession({ sessionToken: "api-bookings-session" });
    const apiClient = createApiClientForTrip(seedTrip, {
      createBookingDoc: vi
        .fn()
        .mockRejectedValue(
          new TripApiError({
            code: "version_conflict",
            message: "duplicate mutation",
            status: 409,
          }),
        ),
      loadTrip: vi.fn().mockResolvedValue({
        trip: seedTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      }),
    });

    renderApiTripAccessSagittariusApp({
      initialView: "bookings",
      routeTripId: seedTrip.id,
      apiClient,
    });

    expect(
      await screen.findByRole("region", { name: /Bookings & Docs|การจองและเอกสาร/i }),
    ).toBeInTheDocument();
    await createBookingDocThroughDialog(user);

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "api-bookings-session",
      ),
    );
    expect(apiClient.createBookingDoc).toHaveBeenCalledTimes(1);
  });
});
