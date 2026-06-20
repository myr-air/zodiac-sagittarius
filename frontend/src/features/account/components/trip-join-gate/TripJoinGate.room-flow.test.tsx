import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { TripJoinGate } from "./TripJoinGate";
import {
  enterTripRoom,
  installLocalStorageStub,
} from "./TripJoinGate.test-support";

const render = renderWithI18n;

describe("TripJoinGate room flow", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  it("uses English participant status copy and lets users reveal password fields", async () => {
    const user = userEvent.setup();
    render(<TripJoinGate trip={seedTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    const roomPassword = screen.getByLabelText(/^Trip password$/i);
    expect(roomPassword).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: /Show trip password/i }));
    expect(roomPassword).toHaveAttribute("type", "text");

    await enterTripRoom(user);

    expect(screen.getAllByText("Ready").length).toBeGreaterThan(0);
    expect(screen.queryByText("First entry")).not.toBeInTheDocument();
    expect(screen.queryByText("Claimed")).not.toBeInTheDocument();
    expect(screen.queryByText("Disabled")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    expect(screen.getByText(/This is your personal password/i)).toBeInTheDocument();
    const participantPassword = screen.getByLabelText(/Set password for Explorer Friend/i);
    expect(participantPassword).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: /Show participant password/i }));
    expect(participantPassword).toHaveAttribute("type", "text");
  }, 45_000);

  it("keeps the selected participant password form adjacent to the selected card", async () => {
    const user = userEvent.setup();
    render(<TripJoinGate trip={seedTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await enterTripRoom(user);
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));

    const selectedCard = screen.getByRole("button", { name: /Explorer Friend/i });
    const authPanel = screen.getByRole("form", { name: /Explorer Friend/i });
    expect(selectedCard.nextElementSibling).toBe(authPanel);
  }, 45_000);

  it("requires the trip id and trip password before choosing a participant", async () => {
    const user = userEvent.setup();
    render(<TripJoinGate trip={seedTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "wrong");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Trip ID or password is incorrect/i);
    expect(screen.queryByRole("heading", { name: /Choose identity/i })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/^Trip password$/i));
    await user.type(screen.getByLabelText(/^Trip password$/i), "seed-trip-pass");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));

    expect(screen.getByRole("heading", { name: /Choose identity/i })).toBeInTheDocument();
  });

  it("uses the local seed trip from the same join form when no API client is provided", async () => {
    const user = userEvent.setup();

    render(
      <TripJoinGate
        trip={seedTrip}
        onTripChange={vi.fn()}
        onAuthenticated={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "seed-trip-pass");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));

    expect(screen.getByRole("heading", { name: /Choose identity/i })).toBeInTheDocument();
  });
});
