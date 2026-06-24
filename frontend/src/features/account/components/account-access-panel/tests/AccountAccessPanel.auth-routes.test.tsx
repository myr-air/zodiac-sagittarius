import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import {
  createAccountClient,
  createTrustedAccountSession,
} from "../testing/account-access-panel-test-clients";
import {
  authForm,
  renderAccountAccessPanel,
} from "../testing/account-access-panel-render-utils";

describe("AccountAccessPanel auth routes", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders account login without exposing trip access tabs on the login path", () => {
    renderAccountAccessPanel({ accessMode: "account-login" });

    expect(screen.queryByRole("tablist", { name: /Access mode/i })).not.toBeInTheDocument();
    expect(screen.getByRole("main", { name: /Account sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Travel ideas. Perfectly planned./i })).toBeInTheDocument();
    const accessTabs = screen.getByRole("navigation", { name: /Account access/i });
    expect(accessTabs).toBeInTheDocument();
    expect(within(accessTabs).getByRole("button", { name: /^Sign in$/i })).toHaveAttribute("aria-current", "page");
    expect(authForm().getByRole("button", { name: /^Sign in$/i })).toBeDisabled();
    expect(screen.getByLabelText(/Email/i)).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText(/^Password$/i)).toHaveAttribute("autocomplete", "current-password");
    expect(screen.queryByRole("button", { name: /Continue with Google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continue with Apple/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Use sign-in code instead/i })).toBeDisabled();
    expect(within(accessTabs).getByRole("button", { name: /^Register$/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
  });

  it("keeps login entry errors inline with the auth form", () => {
    renderAccountAccessPanel({
      accessMode: "account-login",
      accountSession: createTrustedAccountSession({
        userId: "stale-user",
        sessionToken: "stale-account-session",
        trustedDeviceId: "device-stale",
      }),
      initialError: "unauthorized",
    });

    expect(screen.getByRole("main", { name: /Account sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /Portal navigation/i })).not.toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/Sign in again/i);
    expect(alert.closest(".account-toast-stack")).toBeNull();
    expect(alert.closest("form")).toBeTruthy();
  });

  it("renders account registration as a separate account entry path", () => {
    renderAccountAccessPanel({ accessMode: "account-register" });

    expect(screen.queryByRole("tablist", { name: /Access mode/i })).not.toBeInTheDocument();
    const entryPage = document.querySelector(".account-page--entry");
    const accountLoginFlow = document.querySelector(".account-login-flow");
    expect(entryPage).toHaveClass("bg-(--color-page)");
    expect(entryPage?.className).not.toContain("linear-gradient");
    expect(accountLoginFlow).toHaveClass(
      "bg-(--color-surface)",
      "shadow-[0_14px_34px_rgb(15_23_42_/_0.1)]",
    );
    expect(accountLoginFlow?.className).not.toContain("0_24px_54px");
    expect(screen.getByRole("main", { name: /Account register/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Travel ideas. Perfectly planned./i })).toBeInTheDocument();
    const accessTabs = screen.getByRole("navigation", { name: /Account access/i });
    expect(within(accessTabs).getByRole("button", { name: /^Register$/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: /Set password and continue/i })).toBeDisabled();
    expect(screen.getByLabelText(/Email/i)).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText(/^Password$/i)).toHaveAttribute("autocomplete", "new-password");
    expect(within(accessTabs).getByRole("button", { name: /^Sign in$/i })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Trust this device/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Use passkey/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
  });

  it("registers with a trusted account session so split portal routes can reload", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAccountSessionChange = vi.fn();

    renderAccountAccessPanel({ accessMode: "account-register", accountClient, onAccountSessionChange });

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "new-aom@example.test" } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "account-secret" } });
    await user.click(screen.getByRole("button", { name: /Set password and continue/i }));
    fireEvent.change(await screen.findByLabelText(/Verification code/i), { target: { value: "123456" } });
    await user.click(screen.getByRole("button", { name: /Verify email/i }));
    fireEvent.change(await screen.findByLabelText(/Display name/i), { target: { value: "New Aom" } });
    await user.click(screen.getByRole("button", { name: /Finish and start planning/i }));

    expect(accountClient.finishPasswordLogin).toHaveBeenCalledWith({
      flow: "register",
      email: "new-aom@example.test",
      password: "account-secret",
      trustDevice: true,
      deviceLabel: "",
    });
    expect(accountClient.updateSettings).toHaveBeenCalledWith("account-session", expect.objectContaining({ displayName: "New Aom" }));
    await waitFor(() => expect(onAccountSessionChange).toHaveBeenCalledWith(expect.objectContaining({ kind: "trusted" })));
  });

  it("renders trip access without exposing account login tabs on the join path", () => {
    renderAccountAccessPanel({ accessMode: "trip-access" });

    expect(screen.queryByRole("tablist", { name: /Access mode/i })).not.toBeInTheDocument();
    const tripAccessPage = screen.getByRole("main", { name: /Trip access/i });
    expect(tripAccessPage).toBeInTheDocument();
    expect(tripAccessPage).toHaveClass("account-page--trip-access", "bg-(--color-page)");
    expect(tripAccessPage.className).not.toContain("linear-gradient");
    expect(screen.getByRole("heading", { name: /Enter trip room/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Language and currency/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /เปิด seed trip/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Email/i)).not.toBeInTheDocument();
  });
});
