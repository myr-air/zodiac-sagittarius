import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import {
  authForm,
  createAccountClient,
  fillAccountPasswordFields,
  renderAccountAccessPanel,
  switchToThai,
} from "../testing/account-access-panel-test-utils";

describe("AccountAccessPanel auth access", () => {
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
    renderAccountAccessPanel({ accountClient });

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

  it("eager-loads only the above-fold auth collage image", () => {
    renderAccountAccessPanel({ accessMode: "account-login" });

    expect(screen.getByAltText("Krabi beach lagoon with limestone cliffs and a longtail boat")).toHaveAttribute("loading", "eager");
    expect(screen.getByAltText("Kyoto traditional street with wooden houses and a pagoda")).toHaveAttribute("loading", "lazy");
  });

  it("requires a valid email format before continuing", async () => {
    const user = userEvent.setup();
    renderAccountAccessPanel({ accessMode: "account-login" });

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

    fillAccountPasswordFields("aom", "account-secret");
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
    renderAccountAccessPanel({ accessMode: "account-register", accountClient });

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

  it("separates passkey access from email verification with a key icon", async () => {
    const user = userEvent.setup();
    renderAccountAccessPanel();

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));

    expect(screen.getByRole("button", { name: /Use passkey instead/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    expect(screen.getByRole("button", { name: /Use passkey instead/i })).toBeEnabled();
    expect(screen.getAllByTestId("icon-key").length).toBeGreaterThan(0);
  });


});
