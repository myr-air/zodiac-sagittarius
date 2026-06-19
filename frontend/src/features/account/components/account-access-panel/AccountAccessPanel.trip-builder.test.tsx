import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTripApiClient,
  installLocalStorageStub,
  renderTripBuilder,
  selectDestinationCity,
} from "./testing/account-access-panel-test-utils";

describe("AccountAccessPanel trip builder", () => {
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

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Osaka Round Trip" } });
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

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Osaka Round Trip" } });
    await selectDestinationCity(user, "Tokyo", /^Tokyo, Japan$/i);

    const preview = screen.getByRole("region", { name: /Live trip preview/i });
    expect(within(preview).getByText("Osaka Round Trip")).toBeInTheDocument();
    expect(within(preview).getAllByText("Tokyo").length).toBeGreaterThan(0);
    expect(within(preview).getAllByText("Japan").length).toBeGreaterThan(0);
    expect(within(preview).getByText(/Trip preview/i)).toBeInTheDocument();
    expect(within(preview).getByText(/Invite ready/i)).toBeInTheDocument();
    expect(within(preview).getByLabelText(/Flight route from Bangkok to Tokyo/i)).toBeInTheDocument();
    expect(within(preview).getByText(/Join code:/i)).toBeInTheDocument();
    expect(within(preview).getByText(/Invite link appears after create/i)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /Destination inspiration/i })).not.toBeInTheDocument();
  });

  it("separates destination metadata in the selected cards and draft summary", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "ทริปกล่องสุ่ม" } });
    await selectDestinationCity(user, "Shenzhen", /^Shenzhen, China$/i);
    await selectDestinationCity(user, "Hong Kong", /^Hong Kong, Hong Kong$/i);

    const form = screen.getByRole("form", { name: /Create trip/i });
    expect(form.textContent).not.toContain("ChinaAsia");
    expect(form.textContent).not.toContain("Hong KongAsia");
    expect(screen.getAllByText("Asia/Shanghai").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CNY").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Asia/Hong_Kong").length).toBeGreaterThan(0);
    expect(screen.getAllByText("HKD").length).toBeGreaterThan(0);
  });

  it("uses selected non-Japan destination cities in destination cards", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "China Spring Food Trip" } });
    await selectDestinationCity(user, "Beijing", /^Beijing, China$/i);

    const preview = screen.getByRole("region", { name: /Live trip preview/i });
    expect(within(preview).getAllByText("Beijing").length).toBeGreaterThan(0);
    expect(within(preview).getByText("China")).toBeInTheDocument();
    expect(within(preview).queryByText("Kyoto")).not.toBeInTheDocument();
    expect(within(preview).queryByText("Osaka")).not.toBeInTheDocument();
    expect(screen.getAllByText("China").length).toBeGreaterThan(1);
  });

  it("does not add Osaka or Kyoto as selected destination cards when Tokyo is the chosen city", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    await selectDestinationCity(user, "Tokyo", /^Tokyo, Japan$/i);
    await user.type(screen.getByLabelText(/Add city or stop/i), "Tokyo");
    await user.click(screen.getByRole("button", { name: /Add city/i }));

    const previewStep = screen.getByRole("region", { name: /Preview step/i });
    expect(within(previewStep).getAllByText("Tokyo").length).toBeGreaterThan(0);
    expect(within(previewStep).queryByText("Osaka")).not.toBeInTheDocument();
    expect(within(previewStep).queryByText("Kyoto")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Inspiration step/i })).not.toBeInTheDocument();
  });

  it("lets users add city-level destinations without using the map picker", async () => {
    const user = userEvent.setup();
    const { accountClient } = renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Hong Kong May Route" } });
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

  it("uses city-first destinations, hides inspiration, and previews an origin-to-destination flight", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Tokyo Food Run" } });
    expect(screen.getByRole("button", { name: /Language and currency/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Origin city/i)).toHaveValue("Bangkok, Thailand");
    await user.type(screen.getByLabelText(/Search destination cities/i), "Tokyo");
    await user.click(screen.getByRole("button", { name: /^Tokyo, Japan$/i }));

    const preview = screen.getByRole("region", { name: /Live trip preview/i });
    expect(within(preview).getAllByText("Bangkok").length).toBeGreaterThan(0);
    expect(within(preview).getAllByText("Tokyo").length).toBeGreaterThan(0);
    expect(within(preview).getByLabelText(/Flight route from Bangkok to Tokyo/i)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Inspiration step/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /Destination inspiration/i })).not.toBeInTheDocument();
  });

  it("uses a smart route calendar with auto-swap, tour colors, and clear dates", async () => {
    const user = userEvent.setup();
    renderTripBuilder();

    const calendar = screen.getByRole("group", { name: /Route trip calendar/i });
    await user.click(within(calendar).getByRole("button", { name: /Clear dates/i }));
    expect(screen.getByLabelText(/Start date/i)).toHaveValue("");
    expect(screen.getByLabelText(/End date/i)).toHaveValue("");
    await user.click(within(calendar).getByRole("button", { name: /Select Jun 9, 2026 as depart date/i }));
    await user.click(within(calendar).getByRole("button", { name: /Select Jun 5, 2026 as return date/i }));

    await waitFor(() => expect(screen.getByLabelText(/Start date/i)).toHaveValue("2026-06-05"));
    expect(screen.getByLabelText(/End date/i)).toHaveValue("2026-06-09");
    expect(within(calendar).getByRole("button", { name: /Tour day 1/i })).toHaveAttribute("data-date-state", "start");
    expect(within(calendar).getByRole("button", { name: /Tour day 5/i })).toHaveAttribute("data-date-state", "end");
    expect(within(calendar).getByRole("button", { name: /Tour day 2/i })).toHaveAttribute("data-date-state", "in-range");
    expect(within(calendar).getByRole("button", { name: /Tour day 1/i })).toHaveAttribute("data-tour-tone", "odd");
    expect(within(calendar).getByRole("button", { name: /Tour day 2/i })).toHaveAttribute("data-tour-tone", "even");
  });

  it("generates route-aware join credentials without a draft invite token", async () => {
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Hong Kong May Route" } });
    fireEvent.change(screen.getByLabelText(/Search destination cities/i), { target: { value: "Hong Kong" } });
    fireEvent.click(screen.getByRole("button", { name: /^Hong Kong, Hong Kong$/i }));

    const joinCode = screen.getByText(/Join code:/i).textContent?.replace("Join code:", "").trim() ?? "";
    const joinPass = screen.getByLabelText(/Join password/i);

    expect(joinCode).toMatch(/^\d{4}-HKG-[A-Z0-9]{3}$/);
    expect(joinPass).toHaveValue();
    expect(String((joinPass as HTMLInputElement).value)).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(screen.queryByText(/Invite link:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/token=/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Invite link appears after create/i)).toBeInTheDocument();
  });

  it("shows a copyable email-ready invite link after create succeeds", async () => {
    const user = userEvent.setup();
    const apiClient = createTripApiClient();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderTripBuilder({ apiClient });

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Hong Kong May Route" } });
    await selectDestinationCity(user, "Hong Kong", /^Hong Kong, Hong Kong$/i);
    await user.click(screen.getByRole("button", { name: /Create trip/i }));

    const sharePanel = await screen.findByRole("region", { name: /Created trip share link/i });
    expect(apiClient.rotateJoinInviteToken).toHaveBeenCalledWith("trip-created", "member-session");
    expect(within(sharePanel).getByText(/Invite link:/i).textContent).toContain("token=created-token");
    await user.click(within(sharePanel).getByRole("button", { name: /Copy invite link/i }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("token=created-token"));
    expect(within(sharePanel).getByRole("link", { name: /Send email/i })).toHaveAttribute("href", expect.stringContaining("mailto:"));
  });

  it("renders a flight-route fallback with city badges in the ticket map", async () => {
    renderTripBuilder();

    fireEvent.change(await screen.findByLabelText(/Search destination cities/i), { target: { value: "Hong Kong" } });
    fireEvent.click(screen.getByRole("button", { name: /^Hong Kong, Hong Kong$/i }));

    const preview = screen.getByRole("region", { name: /Live trip preview/i });
    const fallback = within(preview).getByLabelText(/Flight route from Bangkok to Hong Kong/i);
    expect(fallback).toBeInTheDocument();
    expect(within(fallback).getByText("TH")).toBeInTheDocument();
    expect(within(fallback).getByText("HK")).toBeInTheDocument();
  });

  it("keeps the ticket preview sticky on desktop and shows workflow steps on smaller viewports", async () => {
    renderTripBuilder();

    const preview = screen.getByRole("region", { name: /Live trip preview/i });
    const createTripStatus = screen.getByRole("group", { name: /Create trip status/i });
    const wizardMain = document.querySelector(".trip-wizard-main");
    const tripNameField = screen.getByLabelText(/Trip name/i).closest(".trip-name-field");
    expect(document.querySelector(".account-page--portal-new-trip")).toHaveClass("!bg-(--color-page)");
    expect(wizardMain).toHaveClass(
      "bg-(--color-surface)",
      "shadow-[var(--shadow-soft)]",
    );
    expect(wizardMain?.className).not.toContain("255_255_255");
    expect(tripNameField).toHaveClass("[&_input]:bg-(--color-surface)", "[&_input]:shadow-none");
    expect(preview).toHaveClass(
      "sticky",
      "bg-(--color-surface)",
      "shadow-[var(--shadow-soft)]",
    );
    expect(preview.className).not.toContain("255_255_255");
    expect(createTripStatus).toHaveClass(
      "sticky",
      "bg-(--color-surface)",
      "shadow-[0_-8px_18px_rgb(15_23_42_/_0.05)]",
    );
    expect(createTripStatus.className).not.toContain("backdrop-blur");
    expect(screen.getByText(/Required:/i)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Trip creation workflow/i })).toBeInTheDocument();
    expect(screen.getByText(/Next: add destination detail/i)).toBeInTheDocument();
  });

  it("uses localized English copy in the trip builder without Thai fallback text", async () => {
    renderTripBuilder();

    const wizard = screen.getByRole("form", { name: /Create trip/i });
    expect(within(wizard).getByText(/Build the trip plan and invite friends when it is ready/i)).toBeInTheDocument();
    expect(within(wizard).getByText(/Add another destination/i)).toBeInTheDocument();
    expect(within(wizard).getByText(/Invite link appears after create/i)).toBeInTheDocument();
    expect(wizard.textContent).not.toMatch(/[ก-๙]/);
  });

  it("shows draft invite readiness without a boarding-pass barcode before the trip is created", async () => {
    renderTripBuilder();

    const preview = screen.getByRole("region", { name: /Live trip preview/i });
    expect(within(preview).getByText(/Invite link appears after create/i)).toBeInTheDocument();
    expect(within(preview).queryByText(/Draft boarding code/i)).not.toBeInTheDocument();
    expect(within(preview).queryByLabelText(/Draft boarding code, generated after create/i)).not.toBeInTheDocument();
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
