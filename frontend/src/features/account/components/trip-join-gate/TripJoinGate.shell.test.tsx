import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { TripJoinGate } from "./TripJoinGate";
import {
  createApiClient,
  installLocalStorageStub,
} from "./TripJoinGate.test-support";

const render = renderWithI18n;

describe("TripJoinGate shell", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  it("renders the join flow in English by default and switches to Thai", async () => {
    const user = userEvent.setup();
    render(
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
    render(
      <TripJoinGate
        trip={seedTrip}
        initialJoinCode="HK-SZ-2025"
        onTripChange={vi.fn()}
        onAuthenticated={vi.fn()}
      />,
    );

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
});
