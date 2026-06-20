import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  installLocalStorageStub,
  renderTripBuilder,
  selectDestinationCity,
} from "./testing/account-access-panel-test-utils";

describe("AccountAccessPanel trip builder flow", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("shows one mobile trip creation step at a time with preview last", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    const tripStep = screen.getByRole("region", { name: /Trip details step/i });
    const placeStep = screen.getByRole("region", { name: /Destination step/i });
    const datesStep = screen.getByRole("region", { name: /Dates step/i });
    const inviteStep = screen.getByRole("region", { name: /Invite step/i });
    const previewStep = screen.getByRole("region", { name: /Preview step/i });

    expect(tripStep).toHaveAttribute("data-mobile-active", "true");
    expect(placeStep).toHaveAttribute("data-mobile-active", "false");
    expect(datesStep).toHaveAttribute("data-mobile-active", "false");
    expect(inviteStep).toHaveAttribute("data-mobile-active", "false");
    expect(previewStep).toHaveAttribute("data-mobile-active", "false");
    expect(screen.queryByRole("region", { name: /Inspiration step/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Trip step/i })).toHaveAttribute("aria-current", "step");

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Tokyo Sprint" } });
    await user.click(screen.getByRole("button", { name: /Next: Place/i }));

    expect(tripStep).toHaveAttribute("data-mobile-active", "false");
    expect(placeStep).toHaveAttribute("data-mobile-active", "true");
    expect(screen.getByRole("button", { name: /Place step/i })).toHaveAttribute("aria-current", "step");

    await selectDestinationCity(user, "Tokyo", /^Tokyo, Japan$/i);
    await user.click(screen.getByRole("button", { name: /Next: Dates/i }));

    expect(placeStep).toHaveAttribute("data-mobile-active", "false");
    expect(datesStep).toHaveAttribute("data-mobile-active", "true");

    await user.click(screen.getByRole("button", { name: /Back: Place/i }));

    expect(placeStep).toHaveAttribute("data-mobile-active", "true");
    expect(datesStep).toHaveAttribute("data-mobile-active", "false");

    await user.click(screen.getByRole("button", { name: /Preview step/i }));

    expect(tripStep).toHaveAttribute("data-mobile-active", "false");
    expect(previewStep).toHaveAttribute("data-mobile-active", "true");
    expect(screen.getByRole("button", { name: /Preview step/i })).toHaveAttribute("aria-current", "step");
  });

  it("does not create a trip when submitting before the review step", async () => {
    const user = userEvent.setup();
    const onAuthenticated = vi.fn();
    const { accountClient } = renderTripBuilder({ onAuthenticated });

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Osaka Round Trip" } });
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: /Create trip/i })).toBeDisabled();
    expect(accountClient.createTrip).not.toHaveBeenCalled();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it("does not create a trip on the same click that enters review", async () => {
    const user = userEvent.setup();
    const { accountClient } = renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Osaka Round Trip" } });
    await selectDestinationCity(user, "Tokyo", /^Tokyo, Japan$/i);

    expect(screen.getAllByText("Japan").length).toBeGreaterThan(0);
    expect(accountClient.createTrip).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Create trip/i }));
    expect(accountClient.createTrip).toHaveBeenCalledTimes(1);
  });

  it("uses selected cities as the new trip destination scope", async () => {
    const user = userEvent.setup();
    const { accountClient } = renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Japan Korea Sprint" } });
    await selectDestinationCity(user, "Tokyo", /^Tokyo, Japan$/i);
    await selectDestinationCity(user, "Seoul", /^Seoul, South Korea$/i);
    expect(screen.getAllByRole("button", { name: /Japan/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Remove Seoul/i })).toBeInTheDocument();

    expect(await screen.findAllByText("Tokyo, Seoul")).not.toHaveLength(0);
    await user.click(screen.getByRole("button", { name: /Create trip/i }));

    expect(accountClient.createTrip).toHaveBeenCalledWith(
      "account-session",
      expect.objectContaining({
        name: "Japan Korea Sprint",
        destinationLabel: "Tokyo, Seoul",
        destinationCities: [
          expect.objectContaining({ city: "Tokyo", country: "Japan", countryCode: "JP" }),
          expect.objectContaining({ city: "Seoul", country: "South Korea", countryCode: "KR" }),
        ],
        countries: ["Japan", "South Korea"],
      }),
    );
  });

  it("lets visible trip builder controls update destinations and dates", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Japan Korea Sprint" } });
    await selectDestinationCity(user, "Tokyo", /^Tokyo, Japan$/i);
    await user.click(screen.getAllByRole("button", { name: /Add another destination/i })[0]);
    expect(screen.getByLabelText(/Search destination cities/i)).toHaveFocus();

    await selectDestinationCity(user, "Seoul", /^Seoul, South Korea$/i);
    expect(await screen.findAllByText("Tokyo, Seoul")).not.toHaveLength(0);

    const depart = screen.getByLabelText(/Start date/i);
    const returnDate = screen.getByLabelText(/End date/i);
    fireEvent.change(depart, { target: { value: "2026-02-10" } });
    fireEvent.change(returnDate, { target: { value: "2026-02-04" } });
    expect(depart).toHaveValue("2026-02-04");
    expect(returnDate).toHaveValue("2026-02-10");
    await user.click(screen.getByRole("button", { name: /Swap depart and return dates/i }));
    expect(depart).toHaveValue("2026-02-10");
    expect(returnDate).toHaveValue("2026-02-04");

    await user.click(screen.getByRole("button", { name: /Remove Seoul/i }));
    expect(screen.queryByRole("button", { name: /South Korea/i })).not.toBeInTheDocument();
    expect(await screen.findAllByText("Tokyo")).not.toHaveLength(0);
  });

  it("copies the generated join code from the preview share strip", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Osaka Round Trip" } });
    await selectDestinationCity(user, "Tokyo", /^Tokyo, Japan$/i);
    const joinCode = screen.getByText(/Join code:/i).textContent?.replace("Join code:", "").trim();
    await user.click(screen.getByRole("button", { name: /Copy/i }));

    expect(writeText).toHaveBeenCalledWith(joinCode);
    expect(await screen.findByText(/Copied/i)).toBeInTheDocument();
  });
});
