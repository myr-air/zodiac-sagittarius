import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TripJoinGate } from "./TripJoinGate";
import { claimTripParticipant } from "@/src/trip/auth";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { createApiClient, enterTripRoom, installLocalStorageStub } from "./TripJoinGate.test-support";

const render = renderWithI18n;

describe("TripJoinGate", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  it("renders the join flow in English by default and switches to Thai", async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <TripJoinGate
        trip={seedTrip}
        onTripChange={() => {}}
        onAuthenticated={() => {}}
      />,
    );

    expect(screen.getByRole("heading", { name: /Enter trip room/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Trip ID/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Language and currency" }));
    await user.click(screen.getByRole("menuitemradio", { name: "ภาษาไทย" }));

    expect(screen.getByRole("heading", { name: /เข้าห้อง trip/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /เข้าห้อง trip/i })).toBeInTheDocument();
  }, 45_000);

  it("prefills the join code from invite route params", () => {
    render(<TripJoinGate trip={seedTrip} initialJoinCode="HK-SZ-2025" onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    expect(screen.getByLabelText(/Trip ID/i)).toHaveValue("HK-SZ-2025");
  });

  it("keeps the trip access visual preview out of complementary landmarks", () => {
    render(<TripJoinGate trip={seedTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    expect(screen.queryByRole("complementary", { name: /Trip access preview/i })).not.toBeInTheDocument();
    const preview = screen.getByLabelText(/Trip access preview/i);
    expect(preview).toHaveClass("trip-access-visual", "bg-(--color-surface-subtle)");
    expect(preview.className).not.toContain("linear-gradient");
    expect(preview.className).not.toContain("radial-gradient");
  });

  it("marks trip room credentials with browser password-manager autocomplete hints", () => {
    render(<TripJoinGate trip={seedTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    expect(screen.getByLabelText(/Trip ID/i)).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText(/^Trip password$/i)).toHaveAttribute("autocomplete", "current-password");
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

  it("does not offer a separate seed access link", () => {
    render(
      <TripJoinGate
        apiClient={createApiClient()}
        trip={seedTrip}
        onTripChange={vi.fn()}
        onAuthenticated={vi.fn()}
      />,
    );

    expect(screen.queryByRole("link", { name: /เปิด seed trip/i })).not.toBeInTheDocument();
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
