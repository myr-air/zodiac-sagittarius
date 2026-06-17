import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { TripApiError } from "@/src/trip/api-client";
import {
  optionalTrailingSlashPattern,
  portalRoutes,
  tripRoutes,
} from "@/src/trip/workspace/sagittarius-app/support";
import { AccountAccessPanel } from "./AccountAccessPanel";
import {
  AccountHarness,
  authForm,
  bytes,
  createAccountClient,
  createTrustedAccountSession,
  installLocalStorageStub,
  render,
  renderAccountAccessPanel,
  stubCredentials,
  switchToThai,
} from "./account-access-panel-test-utils";

describe("AccountAccessPanel", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("auto-switches to account mode when accountSession appears", async () => {
    const view = render(
      <AccountAccessPanel
        accountClient={createAccountClient()}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(view.getByRole("tab", { name: /^Temp access$/i })).toHaveClass("account-tab--active");

    view.rerender(
      <AccountAccessPanel
        accountClient={createAccountClient()}
        accountSession={createTrustedAccountSession({
          userId: "11111111-1111-1111-1111-111111111111",
          sessionToken: "playwright-account-session",
          trustedDeviceId: "device-1",
          createdAt: "2026-05-30T10:00:00.000Z",
          expiresAt: "2030-01-01T10:00:00.000Z",
        })}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(view.getByRole("tab", { name: /^Account$/i })).toHaveClass("account-tab--active");
    expect(await view.findByText("Aom")).toBeInTheDocument();
    expect(view.getByRole("link", { name: /Settings/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.settings)),
    );
  });

  it("does not reload account dashboard data when switching language", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    renderAccountAccessPanel({ accountClient, accountSession: createTrustedAccountSession({
          userId: "11111111-1111-1111-1111-111111111111",
          sessionToken: "playwright-account-session",
          trustedDeviceId: "device-1",
          createdAt: "2026-05-30T10:00:00.000Z",
          expiresAt: "2030-01-01T10:00:00.000Z",
        }) });

    expect(await screen.findByText("Aom", {}, { timeout: 3_000 })).toBeInTheDocument();
    expect(accountClient.loadSettings).toHaveBeenCalledTimes(1);
    expect(accountClient.listTrips).toHaveBeenCalledTimes(1);
    expect(accountClient.loadStats).toHaveBeenCalledTimes(1);

    await switchToThai(user);

    expect(await screen.findByText("User data stats และ session status")).toBeInTheDocument();
    expect(accountClient.loadSettings).toHaveBeenCalledTimes(1);
    expect(accountClient.listTrips).toHaveBeenCalledTimes(1);
    expect(accountClient.loadStats).toHaveBeenCalledTimes(1);
  });

  it("logs in by email, loads settings/history/stats, and creates an owner trip", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAuthenticated = vi.fn();

    render(<AccountHarness accountClient={accountClient} onAuthenticated={onAuthenticated} />);

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    await user.click(screen.getByRole("button", { name: /Use sign-in code instead/i }));
    fireEvent.change(screen.getByLabelText(/Verification code/i), { target: { value: "123456" } });
    await user.click(screen.getByRole("button", { name: /^Sign in$/i }));

    expect(accountClient.finishEmailLogin).toHaveBeenCalledWith({
      challengeId: "login-challenge",
      code: "123456",
      trustDevice: true,
      deviceLabel: "",
    });
    expect(await screen.findByText("Aom", {}, { timeout: 3_000 })).toBeInTheDocument();
    expect(screen.getAllByText("aom@example.test").length).toBeGreaterThan(0);
    expect(screen.getByText("Trusted PC")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Portal navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.base)),
    );
    expect(screen.getByRole("link", { name: /My Trips/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.myTrips)),
    );
    expect(screen.getByRole("link", { name: /Explorer/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.explorer)),
    );
    expect(screen.getByRole("link", { name: /Trip To-dos/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.toDos)),
    );
    expect(screen.getByRole("link", { name: /Travel Vault/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.vault)),
    );
    expect(screen.getByRole("link", { name: /^Settings$/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.settings)),
    );
    expect(screen.getByRole("link", { name: /Sign out/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.signOut)),
    );
    expect(screen.getByText("User data stats and session status.")).toBeInTheDocument();
    expect(accountClient.loadExplorer).toHaveBeenCalledWith("account-session");
    expect(accountClient.listToDos).toHaveBeenCalledWith("account-session");
    expect(accountClient.listVault).toHaveBeenCalledWith("account-session");
  }, 45_000);

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
      const accountClient = createAccountClient();
      const view = render(
        <AccountAccessPanel
          accessMode="account-portal"
          accountClient={accountClient}
          accountSession={createTrustedAccountSession()}
          portalSection={item.section}
          trip={seedTrip}
          onAccountSessionChange={vi.fn()}
          onAuthenticated={vi.fn()}
          onTripChange={vi.fn()}
        />,
      );

      expect(await screen.findByText(item.visible, {}, { timeout: 3_000 })).toBeInTheDocument();
      expect(screen.queryByText(item.hidden)).not.toBeInTheDocument();
      const portalNav = within(screen.getByRole("navigation", { name: /Portal navigation/i }));
      expect(portalNav.getByRole("link", { name: item.nav })).toHaveAttribute("aria-current", "page");
      view.unmount();
    }
  });

  it("marks vault cloud providers as unavailable instead of enabled fake actions", async () => {
    renderAccountAccessPanel({ accessMode: "account-portal", accountSession: createTrustedAccountSession(), portalSection: "vault" });

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

    const view = render(
      <AccountAccessPanel
        accessMode="account-portal"
        accountClient={accountClient}
        accountSession={createTrustedAccountSession()}
        portalSection="trips"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(await screen.findByText("Create your first trip", {}, { timeout: 3_000 })).toBeInTheDocument();
    expect(screen.getByText("Start with a shared route, dates, and owner settings.")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Create trip/i }).at(-1),
    ).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.newTrip)),
    );
    expect(document.querySelector(".portal-empty-state")).toBeInTheDocument();
    view.unmount();

    renderAccountAccessPanel({ accessMode: "account-portal", accountClient, accountSession: createTrustedAccountSession(), portalSection: "todos" });

    expect(await screen.findByText("Create a trip to start shared to-dos", {}, { timeout: 3_000 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Create trip/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.newTrip)),
    );
  });

  it("keeps portal trip rows on the page until the explicit open action", async () => {
    const accountClient = createAccountClient();
    renderAccountAccessPanel({ accessMode: "account-portal", accountClient, accountSession: createTrustedAccountSession(), portalSection: "trips" });

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

    renderAccountAccessPanel({ accessMode: "account-portal", accountClient, accountSession: createTrustedAccountSession(), portalSection: "todos" });

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

    renderAccountAccessPanel({ accessMode: "account-portal", accountClient, accountSession: createTrustedAccountSession(), portalSection: "dashboard", onAccountSessionChange });

    await waitFor(() => expect(onAccountSessionChange).toHaveBeenCalledWith(null));
  });

  it("logs in with a provider-free browser passkey and keeps trusted-device controls", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAccountSessionChange = vi.fn();
    const credentials = stubCredentials();

    renderAccountAccessPanel({ accountClient, onAccountSessionChange });

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    expect(screen.queryByLabelText(/Device label/i)).not.toBeInTheDocument();
    expect(authForm().getByRole("button", { name: /Use passkey instead/i })).toBeEnabled();
    await user.click(authForm().getByRole("button", { name: /Use passkey instead/i }));

    expect(accountClient.startPasskeyLogin).toHaveBeenCalledWith("aom@example.test");
    expect(credentials.get).toHaveBeenCalledWith({
      publicKey: expect.objectContaining({
        challenge: bytes([1, 2, 3, 4]),
        allowCredentials: [{ type: "public-key", id: bytes([5, 6, 7]) }],
        userVerification: "required",
      }),
    });
    expect(accountClient.finishPasskeyLogin).toHaveBeenCalledWith({
      challengeId: "passkey-login-challenge",
      credentialId: "BQYH",
      clientDataJson: "CAk",
      authenticatorData: "DQ4",
      signature: "DxA",
      trustDevice: true,
      deviceLabel: "",
    });
    await waitFor(() => expect(onAccountSessionChange).toHaveBeenCalledWith(expect.objectContaining({ sessionToken: "passkey-session" })));
  });

  it("clears the account session when revoking the current trusted device", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAccountSessionChange = vi.fn();

    renderAccountAccessPanel({ accountClient, accountSession: createTrustedAccountSession(), portalSection: "settings", onAccountSessionChange });

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));
    const currentDeviceRow = (await screen.findByText("Current MacBook")).closest(".account-device-row") as HTMLElement;
    await user.click(within(currentDeviceRow).getByRole("button", { name: /Revoke/i }));

    expect(accountClient.revokeTrustedDevice).toHaveBeenCalledWith("account-session", "device-current");
    expect(accountClient.loadSettings).toHaveBeenCalledTimes(1);
    expect(onAccountSessionChange).toHaveBeenCalledWith(null);
    expect(await screen.findByText("Revoked this trusted device. Please sign in again.")).toBeInTheDocument();
  });
});
