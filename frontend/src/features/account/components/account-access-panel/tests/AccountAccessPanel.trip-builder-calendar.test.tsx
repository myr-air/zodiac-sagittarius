import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import { renderTripBuilder } from "../testing/account-access-panel-render-utils";

describe("AccountAccessPanel trip builder calendar", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("uses a smart route calendar with auto-swap, tour colors, and clear dates", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    const calendar = screen.getByRole("group", { name: /Route trip calendar/i });
    await user.click(within(calendar).getByRole("button", { name: /Clear dates/i }));
    expect(screen.getByLabelText(/Start date/i)).toHaveValue("");
    expect(screen.getByLabelText(/End date/i)).toHaveValue("");
    await user.click(
      within(calendar).getByRole("button", { name: /Select Jun 9, 2026 as depart date/i }),
    );
    await user.click(
      within(calendar).getByRole("button", { name: /Select Jun 5, 2026 as return date/i }),
    );

    await waitFor(() => expect(screen.getByLabelText(/Start date/i)).toHaveValue("2026-06-05"));
    expect(screen.getByLabelText(/End date/i)).toHaveValue("2026-06-09");
    expect(within(calendar).getByRole("button", { name: /Tour day 1/i })).toHaveAttribute(
      "data-date-state",
      "start",
    );
    expect(within(calendar).getByRole("button", { name: /Tour day 5/i })).toHaveAttribute(
      "data-date-state",
      "end",
    );
    expect(within(calendar).getByRole("button", { name: /Tour day 2/i })).toHaveAttribute(
      "data-date-state",
      "in-range",
    );
    expect(within(calendar).getByRole("button", { name: /Tour day 1/i })).toHaveAttribute(
      "data-tour-tone",
      "odd",
    );
    expect(within(calendar).getByRole("button", { name: /Tour day 2/i })).toHaveAttribute(
      "data-tour-tone",
      "even",
    );
  });
});
