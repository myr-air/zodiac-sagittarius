import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import {
  renderTripBuilder,
  selectDestinationCity,
} from "../testing/account-access-panel-test-utils";

describe("AccountAccessPanel trip builder preview", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("allows replacing the default owner display name in the trip builder", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), {
      target: { value: "Osaka Round Trip" },
    });
    await selectDestinationCity(user, "Tokyo", /^Tokyo, Japan$/i);
    const ownerDisplayName = await screen.findByLabelText(/Owner display name/i);

    expect(ownerDisplayName).toHaveValue("Aom");
    await user.clear(ownerDisplayName);
    expect(ownerDisplayName).toHaveValue("");
    await user.type(ownerDisplayName, "Mew");
    expect(ownerDisplayName).toHaveValue("Mew");
  });

  it("keeps a live visual trip preview in sync with the builder form", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), {
      target: { value: "Osaka Round Trip" },
    });
    await selectDestinationCity(user, "Tokyo", /^Tokyo, Japan$/i);

    const preview = screen.getByRole("region", { name: /Live trip preview/i });
    expect(within(preview).getByText("Osaka Round Trip")).toBeInTheDocument();
    expect(within(preview).getAllByText("Tokyo").length).toBeGreaterThan(0);
    expect(within(preview).getAllByText("Japan").length).toBeGreaterThan(0);
    expect(within(preview).getByText(/Trip preview/i)).toBeInTheDocument();
    expect(within(preview).getByText(/Invite ready/i)).toBeInTheDocument();
    expect(
      within(preview).getByLabelText(/Flight route from Bangkok to Tokyo/i),
    ).toBeInTheDocument();
    expect(within(preview).getByText(/Join code:/i)).toBeInTheDocument();
    expect(within(preview).getByText(/Invite link appears after create/i)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /Destination inspiration/i })).not.toBeInTheDocument();
  });
});
