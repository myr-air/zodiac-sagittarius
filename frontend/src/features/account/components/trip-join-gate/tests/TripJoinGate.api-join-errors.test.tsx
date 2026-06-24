import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import { TripApiError } from "@/src/trip/api-client";
import { TripJoinGate } from "../TripJoinGate";
import { createApiClient } from "../testing/support/trip-join-gate-test-utils";

const render = renderWithI18n;

describe("TripJoinGate API join errors", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  it("uses fallback copy for unknown thrown API join errors", async () => {
    const user = userEvent.setup();
    const apiClient = createApiClient({
      joinTrip: vi.fn().mockRejectedValue("network down"),
    });

    render(<TripJoinGate apiClient={apiClient} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "bad");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Trip ID or password is incorrect.");
  });

  it("does not show raw numeric API errors to join users", async () => {
    const user = userEvent.setup();
    const apiClient = createApiClient({
      joinTrip: vi.fn().mockRejectedValue(new Error("404")),
    });

    render(<TripJoinGate apiClient={apiClient} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "bad");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Trip ID or password is incorrect.");
    expect(screen.getByRole("alert")).not.toHaveTextContent(/^404$/);
  });

  it("uses safe API fallback copy while joining", async () => {
    const user = userEvent.setup();
    const apiClient = createApiClient({
      joinTrip: vi.fn().mockRejectedValue(
        new TripApiError({
          code: "invalid_credentials",
          message: "No trip room",
          status: 401,
        }),
      ),
    });

    render(<TripJoinGate apiClient={apiClient} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "bad");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Trip ID or password is incorrect.");
  });
});
