import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  optionalTrailingSlashPattern,
  portalRoutes,
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
} from "./testing/account-access-panel-test-utils";

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
