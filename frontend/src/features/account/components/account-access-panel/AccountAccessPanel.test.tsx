import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
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
  installLocalStorageStub,
  render,
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

  it("keeps temp access as the fast default while exposing account login", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    render(
      <AccountAccessPanel
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveClass("account-tab--active");
    expect(screen.getByRole("heading", { name: /Enter trip room/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));

    expect(screen.getByRole("heading", { name: /Manage trips with an account/i })).toBeInTheDocument();
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    expect(emailInput).toHaveAttribute("autocomplete", "username");
    expect(emailInput).toHaveAttribute("name", "email");
    expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
    expect(passwordInput).toHaveAttribute("name", "password");
    expect(screen.queryByLabelText(/Verification code/i)).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Trust this device/i })).toBeChecked();
    expect(authForm().getByRole("button", { name: /Sign in$/i })).toBeDisabled();
    expect(screen.queryByLabelText(/Device label/i)).not.toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: "aom@example.test" } });
    expect(authForm().getByRole("button", { name: /Sign in$/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /^Send sign-in code$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Use sign-in code instead/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Use passkey instead/i })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: /Trust this device/i })).toBeChecked();

    await user.click(screen.getByRole("button", { name: /Use sign-in code instead/i }));

    expect(await screen.findByLabelText(/Verification code/i)).toHaveAttribute("autocomplete", "one-time-code");
    expect(screen.getByText(/aom@example.test/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Device label/i)).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Trust this device/i })).toBeChecked();
    expect(screen.getByRole("button", { name: /Resend code in 30 seconds/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Change email/i }));

    expect(screen.queryByLabelText(/Verification code/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toHaveValue("aom@example.test");
    expect(screen.getByLabelText(/^Password$/i)).toHaveValue("");

    await switchToThai(user);

    expect(screen.getByRole("checkbox", { name: /เชื่อถืออุปกรณ์นี้/i })).toBeInTheDocument();
  }, 45_000);

  it("enables resend after the email code cooldown finishes", async () => {
    const accountClient = createAccountClient();
    const intervalCallbacks: Array<() => void> = [];
    vi.spyOn(window, "setInterval").mockImplementation((callback) => {
      intervalCallbacks.push(callback as () => void);
      return intervalCallbacks.length as unknown as ReturnType<typeof window.setInterval>;
    });
    vi.spyOn(window, "clearInterval").mockImplementation(() => undefined);
    render(
      <AccountAccessPanel
        accessMode="account-login"
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
      fireEvent.click(screen.getByRole("button", { name: /Use sign-in code instead/i }));
    });
    expect(screen.getByLabelText(/Verification code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resend code in 30 seconds/i })).toBeDisabled();

    for (let count = 0; count < 30; count += 1) {
      act(() => intervalCallbacks.at(-1)?.());
    }

    expect(screen.getByRole("button", { name: /^Resend code$/i })).toBeEnabled();
  });

  it("eager-loads only the above-fold auth collage image", () => {
    render(
      <AccountAccessPanel
        accessMode="account-login"
        accountClient={createAccountClient()}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(screen.getByAltText("Krabi beach lagoon with limestone cliffs and a longtail boat")).toHaveAttribute("loading", "eager");
    expect(screen.getByAltText("Kyoto traditional street with wooden houses and a pagoda")).toHaveAttribute("loading", "lazy");
  });

  it("requires a valid email format before continuing", async () => {
    const user = userEvent.setup();
    render(
      <AccountAccessPanel
        accessMode="account-login"
        accountClient={createAccountClient()}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const signInButton = authForm().getByRole("button", { name: /^Sign in$/i });
    const emailHintId = emailInput.getAttribute("aria-describedby");
    const passwordHintId = passwordInput.getAttribute("aria-describedby");

    expect(signInButton).toBeDisabled();
    expect(emailHintId).toBeTruthy();
    expect(passwordHintId).toBeTruthy();
    expect(document.getElementById(emailHintId ?? "")).toHaveTextContent(/email tied to this trip space/i);
    expect(document.getElementById(passwordHintId ?? "")).toHaveTextContent(/at least 8 characters/i);

    fireEvent.change(emailInput, { target: { value: "aom" } });
    fireEvent.change(passwordInput, { target: { value: "account-secret" } });
    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById(emailHintId ?? "")).toHaveTextContent(/complete email address/i);
    expect(signInButton).toBeDisabled();

    fireEvent.change(emailInput, { target: { value: "aom@example" } });
    expect(signInButton).toBeDisabled();

    fireEvent.change(emailInput, { target: { value: "  aom@example.test  " } });
    expect(emailInput).not.toHaveAttribute("aria-invalid");
    expect(signInButton).toBeEnabled();

    await user.clear(passwordInput);

    expect(signInButton).toBeDisabled();
  });

  it("keeps registration code delivery behind the primary password step", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    render(
      <AccountAccessPanel
        accessMode="account-register"
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const primaryButton = screen.getByRole("button", { name: /Set password and continue/i });

    expect(primaryButton).toBeDisabled();
    expect(screen.queryByRole("button", { name: /^Send code$/i })).not.toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: "new-aom@example.test" } });

    fireEvent.change(passwordInput, { target: { value: "short" } });
    expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    expect(primaryButton).toBeDisabled();

    fireEvent.change(passwordInput, { target: { value: "account-secret" } });
    expect(passwordInput).not.toHaveAttribute("aria-invalid");
    expect(primaryButton).toBeEnabled();

    await user.click(primaryButton);

    await waitFor(() => expect(accountClient.startEmailLogin).toHaveBeenCalledWith("new-aom@example.test"));
  });

  it("sanitizes email one-time codes and waits for six digits before submitting", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    render(
      <AccountAccessPanel
        accessMode="account-login"
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    await user.click(screen.getByRole("button", { name: /Use sign-in code instead/i }));

    const codeInput = await screen.findByLabelText(/Verification code/i);
    const codeForm = codeInput.closest("form");
    expect(codeForm).toBeTruthy();
    const signInButton = within(codeForm as HTMLElement).getByRole("button", { name: /^Sign in$/i });

    expect(codeInput).toHaveAttribute("autocomplete", "one-time-code");
    expect(codeInput).toHaveAttribute("inputmode", "numeric");
    expect(codeInput).toHaveAttribute("pattern", "[0-9]{6}");
    expect(codeInput).not.toHaveAttribute("maxlength");
    expect(signInButton).toBeDisabled();

    fireEvent.change(codeInput, { target: { value: "12ab" } });
    expect(codeInput).toHaveValue("12");
    expect(codeInput).toHaveAttribute("aria-invalid", "true");
    expect(signInButton).toBeDisabled();

    fireEvent.change(codeInput, { target: { value: "12a34b5678" } });
    expect(codeInput).toHaveValue("123456");
    expect(codeInput).not.toHaveAttribute("aria-invalid");
    expect(signInButton).toBeEnabled();

    await user.click(signInButton);

    expect(accountClient.finishEmailLogin).toHaveBeenCalledWith({
      challengeId: "login-challenge",
      code: "123456",
      trustDevice: true,
      deviceLabel: "",
    });
  });

  it("logs in and registers with a password fallback instead of forcing OTP", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAccountSessionChange = vi.fn();
    render(
      <AccountAccessPanel
        accessMode="account-login"
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={onAccountSessionChange}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "account-secret" } });
    await user.click(authForm().getByRole("button", { name: /^Sign in$/i }));

    expect(accountClient.finishPasswordLogin).toHaveBeenCalledWith({
      flow: "login",
      email: "aom@example.test",
      password: "account-secret",
      trustDevice: true,
      deviceLabel: "",
    });
    await waitFor(() => expect(onAccountSessionChange).toHaveBeenCalledWith(expect.objectContaining({ sessionToken: "account-session" })), { timeout: 2_000 });
    expect(screen.queryByRole("link", { name: /Open account portal/i })).not.toBeInTheDocument();
  });

  it("shows a service connection message when account password login cannot reach the API", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    vi.mocked(accountClient.finishPasswordLogin).mockRejectedValueOnce(new Error("Failed to fetch"));
    render(
      <AccountAccessPanel
        accessMode="account-login"
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "account-secret" } });
    await user.click(authForm().getByRole("button", { name: /^Sign in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Could not reach the login service/i);
    expect(screen.queryByText(/Could not sign in with that password/i)).not.toBeInTheDocument();
  });

  it("shows an account credential message when account password login is rejected", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    vi.mocked(accountClient.finishPasswordLogin).mockRejectedValueOnce(
      new TripApiError({ code: "unauthenticated", message: "invalid credentials", status: 401 }),
    );
    render(
      <AccountAccessPanel
        accessMode="account-login"
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "wrong-secret" } });
    await user.click(authForm().getByRole("button", { name: /^Sign in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is not valid.");
    expect(screen.queryByText(/Could not sign in with that password/i)).not.toBeInTheDocument();
  });

  it("shows email delivery failures where the registration code message appears", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    vi.mocked(accountClient.startEmailLogin).mockRejectedValueOnce(
      new TripApiError({
        code: "email_delivery_failed",
        message: "smtp send failed",
        status: 502,
      }),
    );

    render(
      <AccountAccessPanel
        accessMode="account-register"
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "mai@example.test" } });
    fireEvent.change(await screen.findByLabelText(/Password/i), { target: { value: "account-secret" } });
    await user.click(screen.getByRole("button", { name: /Set password and continue/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email service is not ready. Please try again soon.");
    expect(screen.queryByLabelText(/Verification code/i)).not.toBeInTheDocument();
  });

  it("separates passkey access from email verification with a key icon", async () => {
    const user = userEvent.setup();
    render(
      <AccountAccessPanel
        accountClient={createAccountClient()}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));

    expect(screen.getByRole("button", { name: /Use passkey instead/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    expect(screen.getByRole("button", { name: /Use passkey instead/i })).toBeEnabled();
    expect(screen.getAllByTestId("icon-key").length).toBeGreaterThan(0);
  });

  it("renders account login without exposing trip access tabs on the login path", () => {
    render(
      <AccountAccessPanel
        accessMode="account-login"
        accountClient={createAccountClient()}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
    render(
      <AccountAccessPanel
        accessMode="account-login"
        accountClient={createAccountClient()}
        accountSession={{
          userId: "stale-user",
          sessionToken: "stale-account-session",
          kind: "trusted",
          trustedDeviceId: "device-stale",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        }}
        initialError="unauthorized"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("main", { name: /Account sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /Portal navigation/i })).not.toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/Sign in again/i);
    expect(alert.closest(".account-toast-stack")).toBeNull();
    expect(alert.closest("form")).toBeTruthy();
  });

  it("renders account registration as a separate account entry path", () => {
    render(
      <AccountAccessPanel
        accessMode="account-register"
        accountClient={createAccountClient()}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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

    render(
      <AccountAccessPanel
        accessMode="account-register"
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={onAccountSessionChange}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
    render(
      <AccountAccessPanel
        accessMode="trip-access"
        accountClient={createAccountClient()}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
        accountSession={{
          userId: "11111111-1111-1111-1111-111111111111",
          sessionToken: "playwright-account-session",
          kind: "trusted",
          trustedDeviceId: "device-1",
          createdAt: "2026-05-30T10:00:00.000Z",
          expiresAt: "2030-01-01T10:00:00.000Z",
        }}
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
    render(
      <AccountAccessPanel
        accountClient={accountClient}
        accountSession={{
          userId: "11111111-1111-1111-1111-111111111111",
          sessionToken: "playwright-account-session",
          kind: "trusted",
          trustedDeviceId: "device-1",
          createdAt: "2026-05-30T10:00:00.000Z",
          expiresAt: "2030-01-01T10:00:00.000Z",
        }}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
          accountSession={{
            userId: "user-aom",
            sessionToken: "account-session",
            kind: "trusted",
            trustedDeviceId: "device-current",
            createdAt: "2026-05-30T08:00:00.000Z",
            expiresAt: "2026-06-29T08:00:00.000Z",
          }}
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
    render(
      <AccountAccessPanel
        accessMode="account-portal"
        accountClient={createAccountClient()}
        accountSession={{
          userId: "user-aom",
          sessionToken: "account-session",
          kind: "trusted",
          trustedDeviceId: "device-current",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        }}
        portalSection="vault"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
        accountSession={{
          userId: "user-aom",
          sessionToken: "account-session",
          kind: "trusted",
          trustedDeviceId: "device-current",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        }}
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

    render(
      <AccountAccessPanel
        accessMode="account-portal"
        accountClient={accountClient}
        accountSession={{
          userId: "user-aom",
          sessionToken: "account-session",
          kind: "trusted",
          trustedDeviceId: "device-current",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        }}
        portalSection="todos"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(await screen.findByText("Create a trip to start shared to-dos", {}, { timeout: 3_000 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Create trip/i })).toHaveAttribute(
      "href",
      expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.newTrip)),
    );
  });

  it("keeps portal trip rows on the page until the explicit open action", async () => {
    const accountClient = createAccountClient();
    render(
      <AccountAccessPanel
        accessMode="account-portal"
        accountClient={accountClient}
        accountSession={{
          userId: "user-aom",
          sessionToken: "account-session",
          kind: "trusted",
          trustedDeviceId: "device-current",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        }}
        portalSection="trips"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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

    render(
      <AccountAccessPanel
        accessMode="account-portal"
        accountClient={accountClient}
        accountSession={{
          userId: "user-aom",
          sessionToken: "account-session",
          kind: "trusted",
          trustedDeviceId: "device-current",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        }}
        portalSection="todos"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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

    render(
      <AccountAccessPanel
        accessMode="account-portal"
        accountClient={accountClient}
        accountSession={{
          userId: "user-aom",
          sessionToken: "account-session",
          kind: "trusted",
          trustedDeviceId: "device-current",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        }}
        portalSection="dashboard"
        trip={seedTrip}
        onAccountSessionChange={onAccountSessionChange}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    await waitFor(() => expect(onAccountSessionChange).toHaveBeenCalledWith(null));
  });

  it("logs in with a provider-free browser passkey and keeps trusted-device controls", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAccountSessionChange = vi.fn();
    const credentials = stubCredentials();

    render(
      <AccountAccessPanel
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={onAccountSessionChange}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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

    render(
      <AccountAccessPanel
        accountClient={accountClient}
        accountSession={{
          userId: "user-aom",
          sessionToken: "account-session",
          kind: "trusted",
          trustedDeviceId: "device-current",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        }}
        portalSection="settings"
        trip={seedTrip}
        onAccountSessionChange={onAccountSessionChange}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));
    const currentDeviceRow = (await screen.findByText("Current MacBook")).closest(".account-device-row") as HTMLElement;
    await user.click(within(currentDeviceRow).getByRole("button", { name: /Revoke/i }));

    expect(accountClient.revokeTrustedDevice).toHaveBeenCalledWith("account-session", "device-current");
    expect(accountClient.loadSettings).toHaveBeenCalledTimes(1);
    expect(onAccountSessionChange).toHaveBeenCalledWith(null);
    expect(await screen.findByText("Revoked this trusted device. Please sign in again.")).toBeInTheDocument();
  });
});
