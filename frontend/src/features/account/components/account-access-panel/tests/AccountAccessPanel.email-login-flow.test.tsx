import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import {
  optionalTrailingSlashPattern,
  portalRoutes,
} from "@/src/trip/workspace/sagittarius-app/support";
import {
  AccountHarness,
  createAccountClient,
  render,
} from "../testing/account-access-panel-test-utils";

describe("AccountAccessPanel email login flow", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
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
});
