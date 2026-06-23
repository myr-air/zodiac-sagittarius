import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import { renderTripBuilder } from "../testing/account-access-panel-test-utils";

describe("AccountAccessPanel trip builder credentials", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("generates route-aware join credentials without a draft invite token", async () => {
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), {
      target: { value: "Hong Kong May Route" },
    });
    fireEvent.change(screen.getByLabelText(/Search destination cities/i), {
      target: { value: "Hong Kong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Hong Kong, Hong Kong$/i }));

    const joinCode = screen.getByText(/Join code:/i).textContent?.replace("Join code:", "").trim() ?? "";
    const joinPass = screen.getByLabelText(/Join password/i);

    expect(joinCode).toMatch(/^\d{4}-HKG-[A-Z0-9]{3}$/);
    expect(joinPass).toHaveValue();
    expect(String((joinPass as HTMLInputElement).value)).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(screen.queryByText(/Invite link:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/token=/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Invite link appears after create/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/End date/i), {
      target: { value: "2026-08-14" },
    });
    fireEvent.change(screen.getByLabelText(/Start date/i), {
      target: { value: "2026-07-10" },
    });

    await waitFor(() =>
      expect(screen.getByText(/Join code:/i).textContent?.replace("Join code:", "").trim()).toMatch(
        /^0726-HKG-[A-Z0-9]{3}$/,
      ),
    );
  });
});
