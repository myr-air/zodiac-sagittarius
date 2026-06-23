import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import { TripApiError } from "@/src/trip/api-client";
import {
  optionalTrailingSlashPattern,
  portalRoutes,
  tripRoutes,
} from "@/src/trip/workspace/sagittarius-app/support";
import {
  createAccountClient,
  createTrustedAccountSession,
} from "../testing/account-access-panel-test-clients";
import { renderAccountAccessPanel } from "../testing/account-access-panel-render-utils";

describe("AccountAccessPanel portal pages", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders each split portal section from its own route state", async () => {
    const sections = [
      { section: "trips" as const, nav: /My Trips/i, visible: "Seoul Spring", hidden: "User data stats and session status." },
      { section: "new-trip" as const, nav: /My Trips/i, visible: "Trip builder", hidden: "User data stats and session status." },
      { section: "explorer" as const, nav: /Explorer/i, visible: "Upcoming trips", hidden: "Trusted PC" },
      { section: "todos" as const, nav: /Trip To-dos/i, visible: "Book train", hidden: "User data stats and session status." },
      { section: "vault" as const, nav: /Travel Vault/i, visible: "Passport note", hidden: "User data stats and session status." },
      { section: "settings" as const, nav: /^Settings$/i, visible: "Manage local account profile and trusted devices.", hidden: "User data stats and session status." },
      { section: "sign-out" as const, nav: /Sign out/i, visible: "End this account session on this device.", hidden: "User data stats and session status." },
    ];

    for (const item of sections) {
      const view = renderAccountAccessPanel({
        accessMode: "account-portal",
        accountClient: createAccountClient(),
        accountSession: createTrustedAccountSession(),
        portalSection: item.section,
      });

      expect(await screen.findByText(item.visible, {}, { timeout: 3_000 })).toBeInTheDocument();
      expect(screen.queryByText(item.hidden)).not.toBeInTheDocument();
      const portalNav = within(screen.getByRole("navigation", { name: /Portal navigation/i }));
      expect(portalNav.getByRole("link", { name: item.nav })).toHaveAttribute("aria-current", "page");
      view.unmount();
    }
  });

  it("marks vault cloud providers as unavailable instead of enabled fake actions", async () => {
    renderAccountAccessPanel({
      accessMode: "account-portal",
      accountSession: createTrustedAccountSession(),
      portalSection: "vault",
    });

    for (const provider of ["Google Drive", "iCloud", "Dropbox", "OneDrive"]) {
      const providerButton = await screen.findByRole("button", { name: new RegExp(`${provider}.*link paste only`, "i") });
      expect(providerButton).toBeDisabled();
      expect(providerButton).toHaveAttribute("aria-describedby", "cloud-provider-status");
    }
    expect(screen.getByText(/Link paste only for now/i)).toBeInTheDocument();
  });

  it("renders operational empty states instead of blank portal pages", async () => {
    const accountClient = createAccountClient();
    vi.mocked(accountClient.listTrips).mockResolvedValue([]);
    vi.mocked(accountClient.loadExplorer).mockResolvedValue({
      upcomingTrips: 0,
      ownedTrips: 0,
      destinationCount: 0,
      nextTrip: null,
    });
    vi.mocked(accountClient.listToDos).mockResolvedValue([]);

    const view = renderAccountAccessPanel({
      accessMode: "account-portal",
      accountClient,
      accountSession: createTrustedAccountSession(),
      portalSection: "trips",
    });

    expect(await screen.findByText("Create your first trip", {}, { timeout: 3_000 })).toBeInTheDocument();
    expect(screen.getByText("Start with a shared route, dates, and owner settings.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Create trip/i }).at(-1)).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.newTrip)),
    );
    expect(document.querySelector(".portal-empty-state")).toBeInTheDocument();
    view.unmount();

    renderAccountAccessPanel({
      accessMode: "account-portal",
      accountClient,
      accountSession: createTrustedAccountSession(),
      portalSection: "todos",
    });

    expect(await screen.findByText("Create a trip to start shared to-dos", {}, { timeout: 3_000 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Create trip/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.newTrip)),
    );
  });

  it("keeps portal trip rows on the page until the explicit open action", async () => {
    renderAccountAccessPanel({
      accessMode: "account-portal",
      accountClient: createAccountClient(),
      accountSession: createTrustedAccountSession(),
      portalSection: "trips",
    });

    const ownerTripRow = (await screen.findByText("Seoul Spring")).closest(".account-trip-row") as HTMLElement;
    const travelerTripRow = screen.getByText("Taipei Shared").closest(".account-trip-row") as HTMLElement;

    expect(ownerTripRow).not.toHaveAttribute("href");
    expect(travelerTripRow).not.toHaveAttribute("href");
    expect(within(ownerTripRow).getByRole("link", { name: /Open/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(tripRoutes.base("trip-id"))),
    );
    expect(within(travelerTripRow).getByRole("link", { name: /Open/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(tripRoutes.base("trip-traveler"))),
    );
  });

  it("keeps portal to-dos visible when another portal API fails", async () => {
    const accountClient = createAccountClient();
    vi.mocked(accountClient.listVault).mockRejectedValueOnce(new Error("account-load-failed"));

    renderAccountAccessPanel({
      accessMode: "account-portal",
      accountClient,
      accountSession: createTrustedAccountSession(),
      portalSection: "todos",
    });

    expect(await screen.findByText("Book train", {}, { timeout: 3_000 })).toBeInTheDocument();
    expect(screen.getByText("Could not load account data.")).toBeInTheDocument();
    expect(screen.queryByText("No to-dos yet.")).not.toBeInTheDocument();
  });

  it("clears the account session when portal loading is unauthenticated", async () => {
    const accountClient = createAccountClient();
    const onAccountSessionChange = vi.fn();
    vi.mocked(accountClient.loadSettings).mockRejectedValueOnce(new TripApiError({
      code: "unauthenticated",
      message: "session expired",
      status: 401,
    }));

    renderAccountAccessPanel({
      accessMode: "account-portal",
      accountClient,
      accountSession: createTrustedAccountSession(),
      portalSection: "dashboard",
      onAccountSessionChange,
    });

    await waitFor(() => expect(onAccountSessionChange).toHaveBeenCalledWith(null));
  });
});
