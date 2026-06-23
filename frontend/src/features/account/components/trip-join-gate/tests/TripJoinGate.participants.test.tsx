import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import { claimTripParticipant } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";
import { TripJoinGate } from "../TripJoinGate";
import { enterTripRoom } from "../testing/support/trip-join-gate-test-utils";

const render = renderWithI18n;

describe("TripJoinGate participant authentication", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  it("claims a participant on first entry and returns a local session", async () => {
    const user = userEvent.setup();
    const onTripChange = vi.fn();
    const onAuthenticated = vi.fn();
    render(<TripJoinGate trip={seedTrip} onTripChange={onTripChange} onAuthenticated={onAuthenticated} />);

    await enterTripRoom(user);
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    await user.type(screen.getByLabelText(/Set password for Explorer Friend/i), "traveler-pin");
    await user.click(screen.getByRole("button", { name: /Start/i }));

    expect(onTripChange).toHaveBeenCalled();
    expect(onAuthenticated).toHaveBeenCalledWith(expect.objectContaining({ tripId: seedTrip.id, memberId: "member-nam" }));
  });

  it("rejects weak first-entry participant passwords before creating a local session", async () => {
    const user = userEvent.setup();
    const onTripChange = vi.fn();
    const onAuthenticated = vi.fn();
    render(<TripJoinGate trip={seedTrip} onTripChange={onTripChange} onAuthenticated={onAuthenticated} />);

    await enterTripRoom(user);
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    await user.type(screen.getByLabelText(/Set password for Explorer Friend/i), "123");
    await user.click(screen.getByRole("button", { name: /Start/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Set a password with at least 4 characters.");
    expect(onTripChange).not.toHaveBeenCalled();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it("requires the existing participant password before restoring their local identity", async () => {
    const user = userEvent.setup();
    const claimedTrip = claimTripParticipant(seedTrip, "member-beam", "beam-pin");
    const onAuthenticated = vi.fn();
    render(<TripJoinGate trip={claimedTrip} onTripChange={vi.fn()} onAuthenticated={onAuthenticated} />);

    await enterTripRoom(user);
    await user.click(screen.getByRole("button", { name: /Travel Mate/i }));
    const authPanel = screen.getByRole("form", { name: /Travel Mate/i });

    await user.type(within(authPanel).getByLabelText(/Travel Mate's password/i), "wrong");
    await user.click(within(authPanel).getByRole("button", { name: /Confirm/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Password is incorrect/i);
    expect(onAuthenticated).not.toHaveBeenCalled();

    await user.clear(within(authPanel).getByLabelText(/Travel Mate's password/i));
    await user.type(within(authPanel).getByLabelText(/Travel Mate's password/i), "beam-pin");
    await user.click(within(authPanel).getByRole("button", { name: /Confirm/i }));

    expect(onAuthenticated).toHaveBeenCalledWith(expect.objectContaining({ memberId: "member-beam" }));
  });

  it("does not allow disabled participants to claim or login", async () => {
    const user = userEvent.setup();
    const disabledTrip = {
      ...seedTrip,
      members: seedTrip.members.map((member) =>
        member.id === "member-nam" ? { ...member, accessStatus: "disabled" as const } : member,
      ),
    };
    render(<TripJoinGate trip={disabledTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await enterTripRoom(user);

    const disabledParticipant = screen.getByRole("button", { name: /Explorer Friend/i });
    expect(disabledParticipant).toBeDisabled();
    expect(disabledParticipant).toHaveTextContent(/Disabled/i);
    (disabledParticipant as HTMLButtonElement).disabled = false;
    await user.click(disabledParticipant);
    expect(screen.queryByRole("group", { name: /Explorer Friend/i })).not.toBeInTheDocument();
  });
});
