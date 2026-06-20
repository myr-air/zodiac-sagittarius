import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TripApiError } from "@/src/trip/api-client";
import {
  authForm,
  createAccountClient,
  fillAccountPasswordFields,
  installLocalStorageStub,
  renderAccountAccessPanel,
} from "./testing/account-access-panel-test-utils";

describe("AccountAccessPanel password auth", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs in with a password fallback instead of forcing OTP", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAccountSessionChange = vi.fn();
    renderAccountAccessPanel({
      accessMode: "account-login",
      accountClient,
      onAccountSessionChange,
    });

    fillAccountPasswordFields("aom@example.test", "account-secret");
    await user.click(authForm().getByRole("button", { name: /^Sign in$/i }));

    expect(accountClient.finishPasswordLogin).toHaveBeenCalledWith({
      flow: "login",
      email: "aom@example.test",
      password: "account-secret",
      trustDevice: true,
      deviceLabel: "",
    });
    await waitFor(
      () =>
        expect(onAccountSessionChange).toHaveBeenCalledWith(
          expect.objectContaining({ sessionToken: "account-session" }),
        ),
      { timeout: 2_000 },
    );
    expect(
      screen.queryByRole("link", { name: /Open account portal/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a service connection message when account password login cannot reach the API", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    vi.mocked(accountClient.finishPasswordLogin).mockRejectedValueOnce(
      new Error("Failed to fetch"),
    );
    renderAccountAccessPanel({ accessMode: "account-login", accountClient });

    fillAccountPasswordFields("aom@example.test", "account-secret");
    await user.click(authForm().getByRole("button", { name: /^Sign in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Could not reach the login service/i,
    );
    expect(
      screen.queryByText(/Could not sign in with that password/i),
    ).not.toBeInTheDocument();
  });

  it("shows an account credential message when account password login is rejected", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    vi.mocked(accountClient.finishPasswordLogin).mockRejectedValueOnce(
      new TripApiError({
        code: "unauthenticated",
        message: "invalid credentials",
        status: 401,
      }),
    );
    renderAccountAccessPanel({ accessMode: "account-login", accountClient });

    fillAccountPasswordFields("aom@example.test", "wrong-secret");
    await user.click(authForm().getByRole("button", { name: /^Sign in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email or password is not valid.",
    );
    expect(
      screen.queryByText(/Could not sign in with that password/i),
    ).not.toBeInTheDocument();
  });
});
