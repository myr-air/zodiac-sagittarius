import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import { renderTripBuilder } from "../testing/account-access-panel-render-utils";

describe("AccountAccessPanel trip builder submit", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("lets users add city-level destinations without using the map picker", async () => {
    const user = userEvent.setup();
    const { accountClient } = renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), {
      target: { value: "Hong Kong May Route" },
    });
    expect(screen.queryByRole("button", { name: /Pick on map/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/Search destination cities/i), "Hong Kong");
    await user.click(screen.getByRole("button", { name: /^Hong Kong, Hong Kong$/i }));
    await user.type(screen.getByLabelText(/Add city or stop/i), "Central");
    await user.click(screen.getByRole("button", { name: /Add city/i }));

    expect(screen.getAllByText(/Central/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /Create trip/i }));
    expect(accountClient.createTrip).toHaveBeenCalledWith(
      "account-session",
      expect.objectContaining({
        originLabel: "Bangkok, Thailand",
        originCity: "Bangkok",
        originCountry: "Thailand",
        originCountryCode: "TH",
        destinationLabel: "Hong Kong, Central",
        destinationCities: [
          expect.objectContaining({
            city: "Hong Kong",
            country: "Hong Kong",
            countryCode: "HK",
          }),
          expect.objectContaining({
            city: "Central",
            country: "Hong Kong",
            countryCode: "HK",
          }),
        ],
        countries: ["Hong Kong"],
      }),
    );
  });
});
