import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AccountApiClient,
  AccountSession,
  AccountSettings,
  AccountSettingsUpdateRequest,
  AccountTripCreateRequest,
  AccountTripStats,
  AccountTripSummary,
} from "@/src/account/api-client";
import { seedTrip } from "@/src/trip/seed";
import type { TripParticipantSession } from "@/src/trip/types";
import { TripApiError, type TripApiClient } from "@/src/trip/api-client";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { AccountAccessPanel } from "./AccountAccessPanel";

function render(ui: ReactElement) {
  const result = renderWithI18n(ui, { locale: "en" });
  const originalRerender = result.rerender;

  return {
    ...result,
    rerender: (nextUi: ReactElement) => originalRerender(<I18nProvider>{nextUi}</I18nProvider>),
  };
}

function authForm() {
  const form = screen.getByLabelText(/Email/i).closest("form");
  expect(form).toBeTruthy();
  return within(form as HTMLElement);
}

async function switchToThai(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Language and currency/i }));
  await user.click(await screen.findByRole("menuitemradio", { name: /ภาษาไทย/i }));
}

async function selectDestinationCity(user: ReturnType<typeof userEvent.setup>, query: string, option: RegExp) {
  const search = await screen.findByLabelText(/Search destination cities/i);
  await user.clear(search);
  await user.type(search, query);
  await user.click(await screen.findByRole("button", { name: option }));
}

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
    expect(screen.getByRole("main", { name: /Trip access/i })).toBeInTheDocument();
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
    expect(view.getByRole("link", { name: /Settings/i })).toHaveAttribute("href", "/portal/settings");
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
    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("href", "/portal");
    expect(screen.getByRole("link", { name: /My Trips/i })).toHaveAttribute("href", "/portal/my-trips");
    expect(screen.getByRole("link", { name: /Explorer/i })).toHaveAttribute("href", "/portal/explorer");
    expect(screen.getByRole("link", { name: /Trip To-dos/i })).toHaveAttribute("href", "/portal/to-dos");
    expect(screen.getByRole("link", { name: /Travel Vault/i })).toHaveAttribute("href", "/portal/vault");
    expect(screen.getByRole("link", { name: /^Settings$/i })).toHaveAttribute("href", "/portal/settings");
    expect(screen.getByRole("link", { name: /Sign out/i })).toHaveAttribute("href", "/portal/sign-out");
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
    expect(screen.getAllByRole("link", { name: /Create trip/i }).at(-1)).toHaveAttribute("href", "/portal/trips/new");
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
    expect(screen.getByRole("link", { name: /Create trip/i })).toHaveAttribute("href", "/portal/trips/new");
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
    expect(within(ownerTripRow).getByRole("link", { name: /Open/i })).toHaveAttribute("href", "/trips/trip-id");
    expect(within(travelerTripRow).getByRole("link", { name: /Open/i })).toHaveAttribute("href", "/trips/trip-traveler");
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

  it("allows replacing the default owner display name in the trip builder", async () => {
    const user = userEvent.setup();
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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
    const accountClient = createAccountClient();
    const apiClient = createTripApiClient();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <AccountAccessPanel
        accessMode="account-portal"
        accountClient={accountClient}
        apiClient={apiClient}
        accountSession={{
          userId: "user-aom",
          sessionToken: "account-session",
          kind: "trusted",
          trustedDeviceId: "device-current",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        }}
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    fireEvent.change(await screen.findByLabelText(/Search destination cities/i), { target: { value: "Hong Kong" } });
    fireEvent.click(screen.getByRole("button", { name: /^Hong Kong, Hong Kong$/i }));

    const preview = screen.getByRole("region", { name: /Live trip preview/i });
    const fallback = within(preview).getByLabelText(/Flight route from Bangkok to Hong Kong/i);
    expect(fallback).toBeInTheDocument();
    expect(within(fallback).getByText("TH")).toBeInTheDocument();
    expect(within(fallback).getByText("HK")).toBeInTheDocument();
  });

  it("keeps the ticket preview sticky on desktop and shows workflow steps on smaller viewports", async () => {
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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("region", { name: /Live trip preview/i })).toHaveClass("sticky");
    expect(screen.getByRole("group", { name: /Create trip status/i })).toHaveClass("sticky");
    expect(screen.getByText(/Required:/i)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Trip creation workflow/i })).toBeInTheDocument();
    expect(screen.getByText(/Next: add destination detail/i)).toBeInTheDocument();
  });

  it("uses localized English copy in the trip builder without Thai fallback text", async () => {
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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    const wizard = screen.getByRole("form", { name: /Create trip/i });
    expect(within(wizard).getByText(/Build the trip plan and invite friends when it is ready/i)).toBeInTheDocument();
    expect(within(wizard).getByText(/Add another destination/i)).toBeInTheDocument();
    expect(within(wizard).getByText(/Invite link appears after create/i)).toBeInTheDocument();
    expect(wizard.textContent).not.toMatch(/[ก-๙]/);
  });

  it("shows draft invite readiness without a boarding-pass barcode before the trip is created", async () => {
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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    const preview = screen.getByRole("region", { name: /Live trip preview/i });
    expect(within(preview).getByText(/Invite link appears after create/i)).toBeInTheDocument();
    expect(within(preview).queryByText(/Draft boarding code/i)).not.toBeInTheDocument();
    expect(within(preview).queryByLabelText(/Draft boarding code, generated after create/i)).not.toBeInTheDocument();
  });

  it("shows one mobile trip creation step at a time with preview last", async () => {
    const user = userEvent.setup();
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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
    const accountClient = createAccountClient();
    const onAuthenticated = vi.fn();

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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={onAuthenticated}
        onTripChange={vi.fn()}
      />,
    );

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Osaka Round Trip" } });
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: /Create trip/i })).toBeDisabled();
    expect(accountClient.createTrip).not.toHaveBeenCalled();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it("does not create a trip on the same click that enters review", async () => {
    const user = userEvent.setup();
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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Osaka Round Trip" } });
    await selectDestinationCity(user, "Tokyo", /^Tokyo, Japan$/i);

    expect(screen.getAllByText("Japan").length).toBeGreaterThan(0);
    expect(accountClient.createTrip).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Create trip/i }));
    expect(accountClient.createTrip).toHaveBeenCalledTimes(1);
  });

  it("uses selected cities as the new trip destination scope", async () => {
    const user = userEvent.setup();
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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

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
    const accountClient = createAccountClient();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

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
        portalSection="new-trip"
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    fireEvent.change(await screen.findByLabelText(/Trip name/i), { target: { value: "Osaka Round Trip" } });
    await selectDestinationCity(user, "Tokyo", /^Tokyo, Japan$/i);
    const joinCode = screen.getByText(/Join code:/i).textContent?.replace("Join code:", "").trim();
    await user.click(screen.getByRole("button", { name: /Copy/i }));

    expect(writeText).toHaveBeenCalledWith(joinCode);
    expect(await screen.findByText(/Copied/i)).toBeInTheDocument();
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

function installLocalStorageStub() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

function AccountHarness({
  accountClient,
  onAuthenticated,
}: {
  accountClient: AccountApiClient;
  onAuthenticated: (session: TripParticipantSession) => void;
}) {
  const [accountSession, setAccountSession] = useState<AccountSession | null>(null);

  return (
    <AccountAccessPanel
      accountClient={accountClient}
      accountSession={accountSession}
      trip={seedTrip}
      onAccountSessionChange={setAccountSession}
      onAuthenticated={onAuthenticated}
      onTripChange={vi.fn()}
    />
  );
}

function createAccountClient(): AccountApiClient {
  return {
    startEmailLogin: vi.fn().mockResolvedValue({ challengeId: "login-challenge", expiresAt: "2026-05-30T09:00:00.000Z" }),
    finishEmailLogin: vi.fn().mockResolvedValue({
      userId: "user-aom",
      sessionToken: "account-session",
      kind: "trusted",
      trustedDeviceId: "device-current",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    }),
    finishPasswordLogin: vi.fn().mockResolvedValue({
      userId: "user-aom",
      sessionToken: "account-session",
      kind: "trusted",
      trustedDeviceId: "device-current",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    }),
    loadSettings: vi.fn().mockResolvedValue(accountSettings),
    updateSettings: vi.fn().mockImplementation((_sessionToken: string, request: AccountSettingsUpdateRequest) =>
      Promise.resolve({
        ...accountSettings,
        profile: {
          ...accountSettings.profile,
          ...request,
        },
      }),
    ),
    listTrips: vi.fn().mockResolvedValue([accountTrip, accountTravelerTrip]),
    loadStats: vi.fn().mockResolvedValue(accountStats),
    loadExplorer: vi.fn().mockResolvedValue({
      upcomingTrips: 1,
      ownedTrips: 1,
      destinationCount: 2,
      nextTrip: accountTrip,
    }),
    listToDos: vi.fn().mockResolvedValue([
      {
        id: "todo-1",
        tripId: "trip-id",
        tripName: "Seoul Spring",
        title: "Book train",
        status: "open",
        visibility: "shared",
        kind: "booking",
        assigneeId: null,
        relatedItemId: null,
        version: 1,
      },
    ]),
    listVault: vi.fn().mockResolvedValue([
      {
        id: "vault-1",
        tripId: "trip-id",
        tripName: "Seoul Spring",
        kind: "note",
        title: "Passport note",
        detail: "Keep copies ready",
        externalUrl: null,
        source: "vault",
        createdAt: "2026-05-30T08:00:00.000Z",
      },
    ]),
    createVaultItem: vi.fn().mockResolvedValue({
      id: "vault-created",
      tripId: null,
      tripName: null,
      kind: "file",
      title: "Tickets",
      detail: "PDF link",
      externalUrl: "https://example.test/tickets.pdf",
      source: "vault",
      createdAt: "2026-05-30T08:00:00.000Z",
    }),
    createTrip: vi.fn().mockImplementation((_sessionToken: string, request: AccountTripCreateRequest) =>
      Promise.resolve({
        trip: {
          id: "trip-created",
          name: request.name,
          destinationLabel: request.destinationLabel,
          startDate: request.startDate,
          endDate: request.endDate,
          joinId: request.joinId,
          activePlanVariantId: "plan-main",
          ownerMemberId: "member-owner",
          version: 1,
        },
        ownerMemberId: "member-owner",
        memberSession: {
          tripId: "trip-created",
          memberId: "member-owner",
          sessionToken: "member-session",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        },
      }),
    ),
    createTripMemberSession: vi.fn().mockResolvedValue({
      tripId: "trip-id",
      memberId: "member-owner",
      sessionToken: "member-session",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    }),
    claimMember: vi.fn().mockResolvedValue(undefined),
    transferOwner: vi.fn().mockResolvedValue({
      tripId: "trip-id",
      previousOwnerMemberId: "member-owner",
      newOwnerMemberId: "member-target",
    }),
    startPasskeyRegistration: vi.fn().mockResolvedValue({
      challengeId: "passkey-challenge",
      challenge: "AQIDBA",
      expiresAt: "2026-05-30T09:00:00.000Z",
    }),
    finishPasskeyRegistration: vi.fn().mockResolvedValue({
      id: "passkey-id",
      nickname: "Aom passkey",
      createdAt: "2026-05-30T08:00:00.000Z",
      lastUsedAt: null,
    }),
    startPasskeyLogin: vi.fn().mockResolvedValue({
      challengeId: "passkey-login-challenge",
      challenge: "AQIDBA",
      expiresAt: "2026-05-30T09:00:00.000Z",
      allowCredentials: [{ credentialId: "BQYH" }],
    }),
    finishPasskeyLogin: vi.fn().mockResolvedValue({
      userId: "user-aom",
      sessionToken: "passkey-session",
      kind: "trusted",
      trustedDeviceId: "device-passkey",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    }),
    revokeTrustedDevice: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  };
}

function createTripApiClient(): TripApiClient {
  return {
    rotateJoinInviteToken: vi.fn().mockResolvedValue({ token: "created-token", expiresAt: "2026-06-30T00:00:00.000Z" }),
  } as unknown as TripApiClient;
}

function stubCredentials() {
  const credentials = {
    create: vi.fn().mockResolvedValue({
      rawId: bytes([5, 6, 7]),
      response: {
        clientDataJSON: bytes([8, 9]),
        attestationObject: bytes([10, 11, 12]),
      },
    }),
    get: vi.fn().mockResolvedValue({
      rawId: bytes([5, 6, 7]),
      response: {
        clientDataJSON: bytes([8, 9]),
        authenticatorData: bytes([13, 14]),
        signature: bytes([15, 16]),
      },
    }),
  };
  Object.defineProperty(navigator, "credentials", {
    configurable: true,
    value: credentials,
  });
  return credentials;
}

function bytes(values: number[]) {
  return Uint8Array.from(values).buffer;
}

const accountSettings: AccountSettings = {
  profile: {
    id: "user-aom",
    displayName: "Aom",
    avatarColor: "#0f766e",
    locale: "th-TH",
    timezone: "Asia/Bangkok",
    primaryEmail: "aom@example.test",
  },
  passkeys: [],
  trustedDevices: [
    {
      id: "device-laptop",
      label: "Aom laptop",
      userAgent: "Safari",
      createdAt: "2026-05-30T08:00:00.000Z",
      lastSeenAt: "2026-05-30T08:30:00.000Z",
    },
    {
      id: "device-current",
      label: "Current MacBook",
      userAgent: "Safari",
      createdAt: "2026-05-30T08:10:00.000Z",
      lastSeenAt: "2026-05-30T08:40:00.000Z",
    },
  ],
};

const accountTrip: AccountTripSummary = {
  id: "trip-id",
  name: "Seoul Spring",
  destinationLabel: "Seoul",
  startDate: "2026-06-01",
  endDate: "2026-06-05",
  role: "owner",
  memberId: "member-owner",
  ownerMemberId: "member-owner",
  joinedAt: "2026-05-30T08:00:00.000Z",
  isOwner: true,
};

const accountTravelerTrip: AccountTripSummary = {
  id: "trip-traveler",
  name: "Taipei Shared",
  destinationLabel: "Taipei",
  startDate: "2026-07-01",
  endDate: "2026-07-04",
  role: "traveler",
  memberId: "member-traveler",
  ownerMemberId: "member-owner",
  joinedAt: "2026-05-30T08:00:00.000Z",
  isOwner: false,
};

const accountStats: AccountTripStats = {
  tripsTotal: 2,
  tripsOwned: 1,
  activeTrips: 1,
  tempClaimsCompleted: 0,
};
