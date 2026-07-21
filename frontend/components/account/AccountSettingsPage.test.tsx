/**
 * AccountSettingsPage — session present → identity strip (draft-v2).
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import {
  ACCOUNT_SESSION_STORAGE_KEY,
  saveAccountSession,
} from "@/src/auth/account-session";
import { AccountSettingsPage } from "./AccountSettingsPage";

/** Independent literals from draft-v2 identity strip. */
const DISPLAY_NAME = "Aom";
const INITIALS = "AO";
const AVATAR_COLOR = "#0f766e";
const PRIMARY_EMAIL = "aom@joii.app";
const EMAIL_CHIP = "Primary · verified";
const SESSION_TOKEN = "account-session-token-settings";

const ACCOUNT_SESSION = {
  userId: "018f4e80-0000-7000-a000-000000000001",
  sessionToken: SESSION_TOKEN,
  kind: "temporary" as const,
  trustedDeviceId: null,
  createdAt: "2026-07-19T00:00:00Z",
  expiresAt: "2026-07-20T00:00:00Z",
};

const ACCOUNT_SETTINGS_BODY = {
  profile: {
    id: ACCOUNT_SESSION.userId,
    displayName: DISPLAY_NAME,
    avatarColor: AVATAR_COLOR,
    locale: "th-TH",
    timezone: "Asia/Bangkok",
    homeCity: "Bangkok",
    homeCountry: "Thailand",
    primaryEmail: PRIMARY_EMAIL,
  },
  passkeys: [],
  trustedDevices: [],
};

const originalFetch = globalThis.fetch;

/** Shared router.replace spy — close account must leave the portal. */
const routerReplaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/portal/settings",
  useRouter: () => ({
    push: vi.fn(),
    replace: routerReplaceMock,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function pathOf(url: RequestInfo | URL): string {
  const raw = typeof url === "string" ? url : url.toString();
  return new URL(raw, "http://127.0.0.1:5181").pathname;
}

describe("AccountSettingsPage identity strip", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveAccountSession(window.localStorage, ACCOUNT_SESSION);
    expect(window.localStorage.getItem(ACCOUNT_SESSION_STORAGE_KEY)).toBeTruthy();

    globalThis.fetch = vi.fn(async (input) => {
      if (pathOf(input) === "/api/v1/account") {
        return jsonResponse(ACCOUNT_SETTINGS_BODY);
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    }) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.localStorage.clear();
  });

  it("on session present, fetches GET /account and renders identity strip (initials avatar tinted by avatarColor, displayName, primaryEmail, Primary·verified chip)", async () => {
    render(<AccountSettingsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Account settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Live settings now · more features marked Coming soon."),
    ).toBeInTheDocument();

    const identity = await waitFor(() =>
      screen.getByRole("region", { name: "Identity" }),
    );

    expect(within(identity).getByText(DISPLAY_NAME)).toBeInTheDocument();
    expect(within(identity).getByText(PRIMARY_EMAIL)).toBeInTheDocument();
    expect(within(identity).getByText(EMAIL_CHIP)).toBeInTheDocument();

    const avatar = within(identity).getByText(INITIALS);
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveStyle({ backgroundColor: AVATAR_COLOR });

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalled();
    const paths = fetchMock.mock.calls.map(([url]) => pathOf(url!));
    expect(paths).toContain("/api/v1/account");
  });
});

/** Independent user-safe failure copy from GET /account 401 body. */
const LOAD_FAILURE_MESSAGE = "Session is missing or invalid.";

describe("AccountSettingsPage load failure", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveAccountSession(window.localStorage, ACCOUNT_SESSION);
    expect(window.localStorage.getItem(ACCOUNT_SESSION_STORAGE_KEY)).toBeTruthy();

    globalThis.fetch = vi.fn(async (input) => {
      if (pathOf(input) === "/api/v1/account") {
        return jsonResponse(
          {
            error: {
              code: "unauthorized",
              message: LOAD_FAILURE_MESSAGE,
            },
          },
          401,
        );
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    }) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.localStorage.clear();
  });

  it("on load failure, shows a clear error state and does not claim Saved success", async () => {
    render(<AccountSettingsPage />);

    const alert = await waitFor(() => screen.getByRole("alert"));
    expect(alert).toHaveTextContent(LOAD_FAILURE_MESSAGE);
    expect(screen.queryByRole("region", { name: "Identity" })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Saved$/)).not.toBeInTheDocument();
  });
});

/** Independent literals — Password live change (draft-v4 / T4). */
const CURRENT_PASSWORD = "correct-horse-battery";
const NEW_PASSWORD = "new-correct-horse";
const WRONG_CURRENT = "wrong-password";
const WRONG_CURRENT_PASSWORD_ERROR = "current password is invalid";
const UPDATE_PASSWORD_LABEL = "Update password";

function passwordAccordion(): HTMLElement {
  const security = screen.getByRole("region", { name: "Security" });
  const summary = within(security).getByText("Password", { exact: true });
  const accordion = summary.closest("details");
  expect(accordion).toBeTruthy();
  return accordion as HTMLElement;
}

describe("AccountSettingsPage Password change", () => {
  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.localStorage.clear();
  });

  async function renderLoadedSettings(
    fetchMock: ReturnType<typeof vi.fn>,
  ): Promise<void> {
    window.localStorage.clear();
    saveAccountSession(window.localStorage, ACCOUNT_SESSION);
    globalThis.fetch = fetchMock as typeof fetch;
    render(<AccountSettingsPage />);
    await waitFor(() => screen.getByRole("region", { name: "Security" }));
  }

  it("submits changePassword API with current + new password; wrong current shows visible error; success clears fields without fake toast", async () => {
    const user = userEvent.setup();
    let passwordPosts = 0;

    const fetchMock = vi.fn(async (input, init) => {
      const path = pathOf(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (path === "/api/v1/account" && method === "GET") {
        return jsonResponse(ACCOUNT_SETTINGS_BODY);
      }
      if (path === "/api/v1/account/password" && method === "POST") {
        passwordPosts += 1;
        const posted = JSON.parse(String(init?.body)) as {
          currentPassword?: string;
          newPassword?: string;
        };
        if (posted.currentPassword === WRONG_CURRENT) {
          return jsonResponse(
            {
              error: {
                code: "invalid_request",
                message: WRONG_CURRENT_PASSWORD_ERROR,
              },
            },
            400,
          );
        }
        expect(posted).toEqual({
          currentPassword: CURRENT_PASSWORD,
          newPassword: NEW_PASSWORD,
        });
        return new Response(null, { status: 204 });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    await renderLoadedSettings(fetchMock);

    const accordion = passwordAccordion();
    // Boolean assert avoids happy-dom element serialization on failure.
    expect(Boolean(within(accordion).queryByText(/^Coming soon$/))).toBe(
      false,
    );

    const summaryEl = accordion.querySelector("summary");
    expect(summaryEl).toBeTruthy();
    await user.click(summaryEl!);

    const bodyText = accordion.textContent ?? "";
    expect(bodyText).toContain("Current password");
    expect(bodyText).toContain("New password");
    expect(bodyText).toContain("Confirm new password");
    expect(bodyText).toContain(UPDATE_PASSWORD_LABEL);

    const current = within(accordion).getByLabelText("Current password");
    const neu = within(accordion).getByLabelText("New password");
    const confirm = within(accordion).getByLabelText("Confirm new password");
    const update = within(accordion).getByRole("button", {
      name: UPDATE_PASSWORD_LABEL,
    });

    // Wrong current → visible error; fields retained for retry.
    await user.type(current, WRONG_CURRENT);
    await user.type(neu, NEW_PASSWORD);
    await user.type(confirm, NEW_PASSWORD);
    await user.click(update);

    await waitFor(() => {
      expect(passwordPosts).toBe(1);
    });
    expect(
      Boolean(within(accordion).queryByText(WRONG_CURRENT_PASSWORD_ERROR)),
    ).toBe(true);
    expect((current as HTMLInputElement).value).toBe(WRONG_CURRENT);
    expect((neu as HTMLInputElement).value).toBe(NEW_PASSWORD);
    expect((confirm as HTMLInputElement).value).toBe(NEW_PASSWORD);
    expect(Boolean(screen.queryByText(/^Password updated$/))).toBe(false);
    expect(Boolean(screen.queryByText(/^Saved$/))).toBe(false);

    // Success → POST again with correct current; fields clear; no fake toast.
    await user.clear(current);
    await user.type(current, CURRENT_PASSWORD);
    await user.click(update);

    await waitFor(() => {
      expect(passwordPosts).toBe(2);
    });
    expect((current as HTMLInputElement).value).toBe("");
    expect((neu as HTMLInputElement).value).toBe("");
    expect((confirm as HTMLInputElement).value).toBe("");
    expect(Boolean(screen.queryByText(/^Password updated$/))).toBe(false);
    expect(Boolean(screen.queryByText(/^Saved$/))).toBe(false);
    expect(
      document.querySelector(".toast, [data-toast], .account-settings-toast"),
    ).toBeNull();
  });
});

/** Independent literals — Close account (draft-v4 / T4 acceptance #3). */
const CLOSE_PASSWORD = "correct-horse-battery";
const CLOSE_CONFIRM_VALUE = "CLOSE";
const CLOSE_OPEN_LABEL = "Close account…";
const CLOSE_DIALOG_TITLE = "Close account?";
const CLOSE_PASSWORD_LABEL = "Password";
const CLOSE_CONFIRM_LABEL = "Confirmation";
const CLOSE_CONFIRM_BUTTON = "Close account";

function closeAccordion(): HTMLElement {
  const security = screen.getByRole("region", { name: "Security" });
  const summary = within(security).getByText("Close account", { exact: true });
  const accordion = summary.closest("details");
  expect(accordion).toBeTruthy();
  return accordion as HTMLElement;
}

describe("AccountSettingsPage Close account", () => {
  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.localStorage.clear();
    routerReplaceMock.mockClear();
  });

  async function renderLoadedSettings(
    fetchMock: ReturnType<typeof vi.fn>,
  ): Promise<void> {
    window.localStorage.clear();
    saveAccountSession(window.localStorage, ACCOUNT_SESSION);
    expect(window.localStorage.getItem(ACCOUNT_SESSION_STORAGE_KEY)).toBeTruthy();
    globalThis.fetch = fetchMock as typeof fetch;
    render(<AccountSettingsPage />);
    await waitFor(() => screen.getByRole("region", { name: "Security" }));
  }

  it("Close account opens danger dialog requiring password + CLOSE, calls close API, clears client session, and leaves portal; Email/TOTP remain Coming soon", async () => {
    const user = userEvent.setup();
    let closePosts = 0;

    const fetchMock = vi.fn(async (input, init) => {
      const path = pathOf(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (path === "/api/v1/account" && method === "GET") {
        return jsonResponse(ACCOUNT_SETTINGS_BODY);
      }
      if (path === "/api/v1/account/close" && method === "POST") {
        closePosts += 1;
        const posted = JSON.parse(String(init?.body)) as {
          password?: string;
          confirmation?: string;
        };
        expect(posted).toEqual({
          password: CLOSE_PASSWORD,
          confirmation: CLOSE_CONFIRM_VALUE,
        });
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
        return new Response(null, { status: 204 });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    await renderLoadedSettings(fetchMock);

    const security = screen.getByRole("region", { name: "Security" });

    // Email / TOTP stay Coming soon.
    for (const title of ["Email", "Two-factor (TOTP)"] as const) {
      const summary = within(security).getByText(title, { exact: true });
      const accordion = summary.closest("details") as HTMLElement;
      expect(Boolean(within(accordion).queryByText(/^Coming soon$/))).toBe(
        true,
      );
    }

    const accordion = closeAccordion();
    expect(Boolean(within(accordion).queryByText(/^Coming soon$/))).toBe(
      false,
    );

    const summaryEl = accordion.querySelector("summary");
    expect(summaryEl).toBeTruthy();
    await user.click(summaryEl!);

    await user.click(
      within(accordion).getByRole("button", { name: CLOSE_OPEN_LABEL }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: CLOSE_DIALOG_TITLE,
    });

    // Opening alone must not POST close.
    expect(closePosts).toBe(0);

    await user.type(
      within(dialog).getByLabelText(CLOSE_PASSWORD_LABEL),
      CLOSE_PASSWORD,
    );
    await user.type(
      within(dialog).getByLabelText(CLOSE_CONFIRM_LABEL),
      CLOSE_CONFIRM_VALUE,
    );

    const confirm = within(dialog).getByRole("button", {
      name: CLOSE_CONFIRM_BUTTON,
    });
    expect((confirm as HTMLButtonElement).disabled).toBe(false);
    await user.click(confirm);

    await waitFor(() => {
      expect(closePosts).toBe(1);
    });

    // Client session cleared.
    expect(window.localStorage.getItem(ACCOUNT_SESSION_STORAGE_KEY)).toBeNull();

    // Leaves portal (signed-out landing).
    expect(routerReplaceMock).toHaveBeenCalledWith("/login");
  });
});
