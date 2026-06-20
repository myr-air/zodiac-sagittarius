import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TripApiError } from "@/src/trip/api-client";
import {
  createAccountClient,
  fillAccountPasswordFields,
  installLocalStorageStub,
  renderAccountAccessPanel,
} from "./testing/account-access-panel-test-utils";

describe("AccountAccessPanel email code auth", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("enables resend after the email code cooldown finishes", async () => {
    const accountClient = createAccountClient();
    const intervalCallbacks: Array<() => void> = [];
    vi.spyOn(window, "setInterval").mockImplementation((callback) => {
      intervalCallbacks.push(callback as () => void);
      return intervalCallbacks.length as unknown as ReturnType<
        typeof window.setInterval
      >;
    });
    vi.spyOn(window, "clearInterval").mockImplementation(() => undefined);
    renderAccountAccessPanel({ accessMode: "account-login", accountClient });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: "aom@example.test" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: /Use sign-in code instead/i }),
      );
    });
    expect(screen.getByLabelText(/Verification code/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Resend code in 30 seconds/i }),
    ).toBeDisabled();

    for (let count = 0; count < 30; count += 1) {
      act(() => intervalCallbacks.at(-1)?.());
    }

    expect(screen.getByRole("button", { name: /^Resend code$/i })).toBeEnabled();
  });

  it("sanitizes email one-time codes and waits for six digits before submitting", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    renderAccountAccessPanel({ accessMode: "account-login", accountClient });

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "aom@example.test" },
    });
    await user.click(
      screen.getByRole("button", { name: /Use sign-in code instead/i }),
    );

    const codeInput = await screen.findByLabelText(/Verification code/i);
    const codeForm = codeInput.closest("form");
    expect(codeForm).toBeTruthy();
    const signInButton = within(codeForm as HTMLElement).getByRole("button", {
      name: /^Sign in$/i,
    });

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

    renderAccountAccessPanel({ accessMode: "account-register", accountClient });

    fillAccountPasswordFields("mai@example.test", "account-secret");
    await user.click(
      screen.getByRole("button", { name: /Set password and continue/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email service is not ready. Please try again soon.",
    );
    expect(screen.queryByLabelText(/Verification code/i)).not.toBeInTheDocument();
  });
});
