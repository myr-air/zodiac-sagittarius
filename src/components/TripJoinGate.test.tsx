import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TripJoinGate } from "./TripJoinGate";
import { claimTripParticipant } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";

describe("TripJoinGate", () => {
  it("requires the trip id and trip password before choosing a participant", async () => {
    const user = userEvent.setup();
    render(<TripJoinGate trip={seedTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/Trip password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Trip ID หรือ password ไม่ถูกต้อง/i);
    expect(screen.queryByRole("heading", { name: /เลือกตัวตน/i })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Trip password/i));
    await user.type(screen.getByLabelText(/Trip password/i), "dim-sum-run");
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));

    expect(screen.getByRole("heading", { name: /เลือกตัวตน/i })).toBeInTheDocument();
  });

  it("claims a participant on first entry and returns a local session", async () => {
    const user = userEvent.setup();
    const onTripChange = vi.fn();
    const onAuthenticated = vi.fn();
    render(<TripJoinGate trip={seedTrip} onTripChange={onTripChange} onAuthenticated={onAuthenticated} />);

    await enterTripRoom(user);
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    await user.type(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), "traveler-pin");
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    expect(onTripChange).toHaveBeenCalled();
    expect(onAuthenticated).toHaveBeenCalledWith(expect.objectContaining({ tripId: seedTrip.id, memberId: "member-nam" }));
  });

  it("requires the existing participant password before restoring their local identity", async () => {
    const user = userEvent.setup();
    const claimedTrip = claimTripParticipant(seedTrip, "member-beam", "beam-pin");
    const onAuthenticated = vi.fn();
    render(<TripJoinGate trip={claimedTrip} onTripChange={vi.fn()} onAuthenticated={onAuthenticated} />);

    await enterTripRoom(user);
    await user.click(screen.getByRole("button", { name: /Travel Mate/i }));
    const authPanel = screen.getByRole("group", { name: /Travel Mate/i });

    await user.type(within(authPanel).getByLabelText(/รหัสของ Travel Mate/i), "wrong");
    await user.click(within(authPanel).getByRole("button", { name: /ยืนยันตัวตน/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/รหัสไม่ถูกต้อง/i);
    expect(onAuthenticated).not.toHaveBeenCalled();

    await user.clear(within(authPanel).getByLabelText(/รหัสของ Travel Mate/i));
    await user.type(within(authPanel).getByLabelText(/รหัสของ Travel Mate/i), "beam-pin");
    await user.click(within(authPanel).getByRole("button", { name: /ยืนยันตัวตน/i }));

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
  });
});

async function enterTripRoom(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
  await user.type(screen.getByLabelText(/Trip password/i), "dim-sum-run");
  await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
}
