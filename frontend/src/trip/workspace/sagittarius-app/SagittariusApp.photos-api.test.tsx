import {
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  createApiClientForTrip,
  installApiSession,
  renderApiTripAccessSagittariusApp,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit photos API mode", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("creates photo albums through the API client in API mode", async () => {
    const user = userEvent.setup();
    installApiSession({ sessionToken: "api-photos-session" });
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

    renderApiTripAccessSagittariusApp({
      initialView: "photos",
      routeTripId: seedTrip.id,
      apiClient,
    });

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
});
