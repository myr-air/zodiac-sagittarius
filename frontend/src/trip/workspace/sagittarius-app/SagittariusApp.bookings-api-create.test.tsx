import {
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { createBookingDocThroughDialog } from "./testing/support/sagittarius-app-booking-actions";
import {
  createApiClientForTrip,
  installApiSession,
  renderApiTripAccessSagittariusApp,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit bookings API creation", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("creates booking docs through the API client in API mode", async () => {
    const user = userEvent.setup();
    installApiSession({ sessionToken: "api-bookings-session" });
    const apiBooking = {
      ...(seedTrip.bookingDocs ?? [])[0],
      id: "018f4e87-1111-7000-8000-000000009999",
      title: "Airport Express pass",
      type: "public_transport" as const,
      status: "booked" as const,
      externalLinks: [
        {
          id: "018f4e88-1111-7000-8000-000000009999",
          label: "External link",
          url: "https://drive.google.com/airport-express",
          provider: "Google Drive",
          accessNote: null,
        },
      ],
      updatedAt: "2026-05-29T00:00:00.000Z",
      version: 1,
    };
    const apiClient = createApiClientForTrip(seedTrip, {
      createBookingDoc: vi.fn().mockResolvedValue(apiBooking),
    });

    renderApiTripAccessSagittariusApp({
      initialView: "bookings",
      routeTripId: seedTrip.id,
      apiClient,
    });

    expect(
      await screen.findByRole("region", { name: /Bookings & Docs|การจองและเอกสาร/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Select Bangkok to Hong Kong flight|เลือก Bangkok to Hong Kong flight/i,
      }),
    ).toBeInTheDocument();
    await createBookingDocThroughDialog(user, {
      externalLink: "https://drive.google.com/airport-express",
    });

    await waitFor(() =>
      expect(apiClient.createBookingDoc).toHaveBeenCalledWith(
        seedTrip.id,
        "api-bookings-session",
        expect.objectContaining({
          clientMutationId: expect.stringMatching(/^booking-doc-create-/),
          title: "Airport Express pass",
          type: "public_transport",
          status: "booked",
          externalLinks: [
            expect.objectContaining({
              label: expect.stringMatching(/External link|ลิงก์ภายนอก/),
              url: "https://drive.google.com/airport-express",
              provider: null,
            }),
          ],
        }),
      ),
    );
    expect(
      await screen.findByRole("button", {
        name: /Select Airport Express pass|เลือก Airport Express pass/i,
      }),
    ).toBeInTheDocument();
  });
});
