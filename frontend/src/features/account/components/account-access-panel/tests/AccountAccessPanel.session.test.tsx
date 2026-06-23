import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import { seedTrip } from "@/src/trip/seed";
import {
  optionalTrailingSlashPattern,
  portalRoutes,
} from "@/src/trip/workspace/sagittarius-app/support";
import { AccountAccessPanel } from "../AccountAccessPanel";
import {
  createAccountClient,
  createTrustedAccountSession,
  render,
  renderAccountAccessPanel,
  switchToThai,
} from "../testing/account-access-panel-test-utils";

describe("AccountAccessPanel session", () => {
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

    expect(view.getByRole("tab", { name: /^Temp access$/i })).toHaveClass(
      "account-tab--active",
    );

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

    expect(view.getByRole("tab", { name: /^Account$/i })).toHaveClass(
      "account-tab--active",
    );
    expect(await view.findByText("Aom")).toBeInTheDocument();
    expect(view.getByRole("link", { name: /Settings/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.settings)),
    );
  });

  it("does not reload account dashboard data when switching language", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    renderAccountAccessPanel({
      accountClient,
      accountSession: createTrustedAccountSession({
        userId: "11111111-1111-1111-1111-111111111111",
        sessionToken: "playwright-account-session",
        trustedDeviceId: "device-1",
        createdAt: "2026-05-30T10:00:00.000Z",
        expiresAt: "2030-01-01T10:00:00.000Z",
      }),
    });

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

  it("clears the account session when revoking the current trusted device", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAccountSessionChange = vi.fn();

    renderAccountAccessPanel({
      accountClient,
      accountSession: createTrustedAccountSession(),
      portalSection: "settings",
      onAccountSessionChange,
    });

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));
    const currentDeviceRow = (await screen.findByText("Current MacBook")).closest(
      ".account-device-row",
    ) as HTMLElement;
    await user.click(within(currentDeviceRow).getByRole("button", { name: /Revoke/i }));

    expect(accountClient.revokeTrustedDevice).toHaveBeenCalledWith(
      "account-session",
      "device-current",
    );
    expect(accountClient.loadSettings).toHaveBeenCalledTimes(1);
    expect(onAccountSessionChange).toHaveBeenCalledWith(null);
    await waitFor(() =>
      expect(
        screen.getByText("Revoked this trusted device. Please sign in again."),
      ).toBeInTheDocument(),
    );
  });
});
