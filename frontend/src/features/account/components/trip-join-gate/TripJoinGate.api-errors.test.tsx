import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { TripApiError } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import { TripJoinGate } from "./TripJoinGate";
import { createApiClient, enterTripRoom, installLocalStorageStub } from "./TripJoinGate.test-support";

const render = renderWithI18n;

describe("TripJoinGate API errors", () => {
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

  it("does not label an API cockpit load failure as a participant password error", async () => {
    const user = userEvent.setup();
    const apiClient = createApiClient({
      joinTrip: vi.fn().mockResolvedValue({
        trip: {
          id: seedTrip.id,
          name: seedTrip.name,
          destinationLabel: seedTrip.destinationLabel,
          startDate: seedTrip.startDate,
          endDate: seedTrip.endDate,
          joinId: seedTrip.joinId,
          activePlanVariantId: seedTrip.activePlanVariantId,
          ownerMemberId: "member-aom",
          version: 1,
        },
        claimableMembers: [
          {
            id: "member-beam",
            tripId: seedTrip.id,
            displayName: "Beam",
            role: "organizer",
            accessStatus: "active",
            presence: "offline",
            color: "#2563eb",
            userId: null,
            claimedAt: "2026-06-05T00:00:00.000Z",
            lastSeenAt: null,
          },
        ],
        joinSessionToken: "join-session-token",
        expiresAt: "2026-06-12T00:00:00.000Z",
      }),
      loginMember: vi.fn().mockResolvedValue({
        tripId: seedTrip.id,
        memberId: "member-beam",
        sessionToken: "beam-session-token",
        createdAt: "2026-06-05T00:00:00.000Z",
        expiresAt: "2026-06-12T00:00:00.000Z",
      }),
      loadTrip: vi.fn().mockRejectedValue(
        new TripApiError({
          code: "database_error",
          message: "database error",
          status: 500,
        }),
      ),
    });
    const onAuthenticated = vi.fn();

    render(<TripJoinGate apiClient={apiClient} onTripChange={vi.fn()} onAuthenticated={onAuthenticated} />);

    await enterTripRoom(user);
    await user.click(await screen.findByRole("button", { name: /Beam/i }));
    await user.type(screen.getByLabelText(/Beam's password/i), "beam-pass-2026");
    await user.click(screen.getByRole("button", { name: /Confirm/i }));

    expect(apiClient.loginMember).toHaveBeenCalledWith(seedTrip.id, "member-beam", "beam-pass-2026", "join-session-token");
    expect(apiClient.loadTrip).toHaveBeenCalledWith(seedTrip.id, "beam-session-token");
    expect(screen.getByRole("alert")).toHaveTextContent(/Password was accepted, but the trip could not be loaded/i);
    expect(screen.getByRole("alert")).not.toHaveTextContent("Password is incorrect.");
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it("uses safe API fallback copy while joining and authenticating", async () => {
    const user = userEvent.setup();
    const apiClient = createApiClient({
      joinTrip: vi.fn()
        .mockRejectedValueOnce(new TripApiError({ code: "invalid_credentials", message: "No trip room", status: 401 }))
        .mockResolvedValueOnce({
          trip: {
            id: seedTrip.id,
            name: seedTrip.name,
            destinationLabel: seedTrip.destinationLabel,
            startDate: seedTrip.startDate,
            endDate: seedTrip.endDate,
            joinId: seedTrip.joinId,
            activePlanVariantId: seedTrip.activePlanVariantId,
            ownerMemberId: "member-aom",
            version: 1,
          },
          claimableMembers: [{
            id: "member-aom",
            tripId: seedTrip.id,
            displayName: "Demo Traveler",
            role: "owner",
            accessStatus: "active",
            presence: "online",
            color: "#0f766e",
            userId: null,
            claimedAt: null,
            lastSeenAt: null,
          }],
          joinSessionToken: "join-session-token",
          expiresAt: "2026-05-29T00:20:00.000Z",
        }),
      claimMember: vi.fn().mockRejectedValue(new TripApiError({ code: "invalid_request", message: "Already claimed", status: 400 })),
      loginMember: vi.fn().mockRejectedValue(new Error("Backend login unavailable")),
    });

    render(<TripJoinGate apiClient={apiClient} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "bad");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("Trip ID or password is incorrect.");

    await user.clear(screen.getByLabelText(/^Trip password$/i));
    await user.type(screen.getByLabelText(/^Trip password$/i), "seed-trip-pass");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));
    await user.click(await screen.findByRole("button", { name: /Demo Traveler/i }));
    await user.type(screen.getByLabelText(/Set password for Demo Traveler/i), "owner-pin");
    await user.click(screen.getByRole("button", { name: /Start|Confirm/i }));

    expect(apiClient.loginMember).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Password is incorrect.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("Already claimed");
  });

  it("does not fall back to login when backend claiming fails for a non-validation reason", async () => {
    const user = userEvent.setup();
    const apiClient = createApiClient({
      joinTrip: vi.fn().mockResolvedValue({
        trip: {
          id: seedTrip.id,
          name: seedTrip.name,
          destinationLabel: seedTrip.destinationLabel,
          startDate: seedTrip.startDate,
          endDate: seedTrip.endDate,
          joinId: seedTrip.joinId,
          activePlanVariantId: seedTrip.activePlanVariantId,
          ownerMemberId: "member-aom",
          version: 1,
        },
        claimableMembers: [{
          id: "member-aom",
          tripId: seedTrip.id,
          displayName: "Demo Traveler",
          role: "owner",
          accessStatus: "active",
          presence: "online",
          color: "#0f766e",
          userId: null,
          claimedAt: null,
          lastSeenAt: null,
        }],
        joinSessionToken: "join-session-token",
        expiresAt: "2026-05-29T00:20:00.000Z",
      }),
      claimMember: vi.fn().mockRejectedValue(new TripApiError({ code: "server_error", message: "Claim service down", status: 500 })),
      loginMember: vi.fn(),
    });

    render(<TripJoinGate apiClient={apiClient} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "seed-trip-pass");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));
    await user.click(await screen.findByRole("button", { name: /Demo Traveler/i }));
    await user.type(screen.getByLabelText(/Set password for Demo Traveler/i), "owner-pin");
    await user.click(screen.getByRole("button", { name: /Start|Confirm/i }));

    expect(apiClient.loginMember).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Password is incorrect.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("Claim service down");
  });
});
