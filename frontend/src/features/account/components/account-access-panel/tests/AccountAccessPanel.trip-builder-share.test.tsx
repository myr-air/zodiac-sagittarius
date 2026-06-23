import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import {
  createTripApiClient,
  renderTripBuilder,
  selectDestinationCity,
} from "../testing/account-access-panel-test-utils";

describe("AccountAccessPanel trip builder share preview", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
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
    expect(within(sharePanel).getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(within(sharePanel).getByRole("link", { name: /Send email/i })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:"),
    );
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
    expect(wizardMain).toHaveClass("bg-(--color-surface)", "shadow-[var(--shadow-soft)]");
    expect(wizardMain?.className).not.toContain("255_255_255");
    expect(tripNameField).toHaveClass("[&_input]:bg-(--color-surface)", "[&_input]:shadow-none");
    expect(preview).toHaveClass("sticky", "bg-(--color-surface)", "shadow-[var(--shadow-soft)]");
    expect(preview.className).not.toContain("255_255_255");
    expect(createTripStatus).toHaveClass("sticky", "bg-(--color-surface)", "shadow-[0_-8px_18px_rgb(15_23_42_/_0.05)]");
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
});
