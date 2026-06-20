import {
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { TripApiError } from "@/src/trip/api-client";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";
import {
  createApiClientForTrip,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit bookings and photos API mode", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("creates photo albums through the API client in API mode", async () => {
    const user = userEvent.setup();
    installApiSession("api-photos-session");
    const apiAlbum = {
      ...(seedTrip.photoAlbumLinks ?? [])[0],
      id: "018f4e89-1111-7000-8000-000000009999",
      title: "Trip group album",
      provider: "google_photos" as const,
      url: "https://photos.app.goo.gl/trip-group",
      access: "collaborative" as const,
      updatedAt: "2026-05-29T00:00:00.000Z",
      version: 1,
    };
    const apiClient = createApiClientForTrip(seedTrip, {
      createPhotoAlbum: vi.fn().mockResolvedValue(apiAlbum),
    });

    render(
      <SagittariusApp
        accessMode="trip-access"
        initialView="photos"
        requireJoin
        dataSource="api"
        routeTripId={seedTrip.id}
        apiClient={apiClient}
      />,
    );

    expect(
      await screen.findByRole("region", { name: /Photos & Albums|รูปภาพและอัลบั้ม/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Add album|เพิ่มอัลบั้ม/i }));
    const dialog = screen.getByRole("dialog", { name: /Add album|เพิ่มอัลบั้ม/i });
    fireEvent.change(within(dialog).getByLabelText(/Title|ชื่อ/i), {
      target: { value: "Trip group album" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Provider|ผู้ให้บริการ/i), {
      target: { value: "google_photos" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Album link|ลิงก์อัลบั้ม/i), {
      target: { value: "https://photos.app.goo.gl/trip-group" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: /Save album|บันทึกอัลบั้ม/i }),
    );

    await waitFor(() =>
      expect(apiClient.createPhotoAlbum).toHaveBeenCalledWith(
        seedTrip.id,
        "api-photos-session",
        expect.objectContaining({
          clientMutationId: expect.stringMatching(/^photo-album-create-/),
          title: "Trip group album",
          provider: "google_photos",
          url: "https://photos.app.goo.gl/trip-group",
          access: "collaborative",
        }),
      ),
    );
    expect(
      await screen.findByRole("button", {
        name: /Select Trip group album|เลือก Trip group album/i,
      }),
    ).toBeInTheDocument();
  });

  it("creates booking docs through the API client in API mode", async () => {
    const user = userEvent.setup();
    installApiSession("api-bookings-session");
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

    render(
      <SagittariusApp
        accessMode="trip-access"
        initialView="bookings"
        requireJoin
        dataSource="api"
        routeTripId={seedTrip.id}
        apiClient={apiClient}
      />,
    );

    expect(
      await screen.findByRole("region", { name: /Bookings & Docs|การจองและเอกสาร/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Select Bangkok to Hong Kong flight|เลือก Bangkok to Hong Kong flight/i,
      }),
    ).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /Add booking|เพิ่มการจอง/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /Add booking|เพิ่มการจอง/i });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^(Title|ชื่อ)$/i }), {
      target: { value: "Airport Express pass" },
    });
    fireEvent.change(within(dialog).getByRole("combobox", { name: /^(Type|ประเภท)$/i }), {
      target: { value: "public_transport" },
    });
    fireEvent.change(within(dialog).getByRole("combobox", { name: /^(Status|สถานะ)$/i }), {
      target: { value: "booked" },
    });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^(External link|ลิงก์ภายนอก)$/i }), {
      target: { value: "https://drive.google.com/airport-express" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: /Save booking|บันทึกการจอง/i }),
    );

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

  it("does not retry booking doc creates with a new mutation id after create conflicts", async () => {
    const user = userEvent.setup();
    installApiSession("api-bookings-session");
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

    render(
      <SagittariusApp
        accessMode="trip-access"
        initialView="bookings"
        requireJoin
        dataSource="api"
        routeTripId={seedTrip.id}
        apiClient={apiClient}
      />,
    );

    expect(
      await screen.findByRole("region", { name: /Bookings & Docs|การจองและเอกสาร/i }),
    ).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /Add booking|เพิ่มการจอง/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /Add booking|เพิ่มการจอง/i });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^(Title|ชื่อ)$/i }), {
      target: { value: "Airport Express pass" },
    });
    fireEvent.change(within(dialog).getByRole("combobox", { name: /^(Type|ประเภท)$/i }), {
      target: { value: "public_transport" },
    });
    fireEvent.change(within(dialog).getByRole("combobox", { name: /^(Status|สถานะ)$/i }), {
      target: { value: "booked" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: /Save booking|บันทึกการจอง/i }),
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "api-bookings-session",
      ),
    );
    expect(apiClient.createBookingDoc).toHaveBeenCalledTimes(1);
  });
});

function installApiSession(sessionToken: string) {
  window.sessionStorage.setItem(
    tripParticipantSessionStorageKey,
    JSON.stringify({
      tripId: seedTrip.id,
      memberId: seedTrip.members[0].id,
      sessionToken,
      createdAt: "2026-05-29T00:00:00.000Z",
      expiresAt: "2026-06-28T00:00:00.000Z",
    }),
  );
}
