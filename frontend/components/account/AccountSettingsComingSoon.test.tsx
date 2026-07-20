/**
 * Account settings Coming soon — Connections + Security chrome (draft-v2).
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 *
 * Public surface: AccountSettingsComingSoon (and AccountSettingsPage wiring).
 * Scope lock: labeled non-acting UI only — no OAuth fetch, no fake success.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
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
import { AccountSettingsComingSoon } from "./AccountSettingsComingSoon";
import { AccountSettingsPage } from "./AccountSettingsPage";

/** Independent literals — Connections providers (draft-v2). */
const CONNECTION_PROVIDERS = [
  "Google Drive",
  "Google Photos",
  "Instagram",
  "Facebook",
  "LINE",
] as const;

/** Independent literal — Connections section soon-note (draft-v2). */
const CONNECTIONS_SOON_NOTE =
  "Account OAuth is not available yet. Trip album links can still use Google providers as URLs.";

/** Independent literals — Security accordion titles + Coming soon tag (draft-v2). */
const SECURITY_ACCORDIONS = [
  "Email",
  "Password",
  "Two-factor (TOTP)",
  "Close account",
] as const;

/** Independent literals — Security soon-notes (draft-v2). */
const EMAIL_SOON_NOTE =
  "Change-email flow needs a new verified challenge API — not in this ship.";
const PASSWORD_SOON_NOTE =
  "Sign-in password exists; authenticated change-password endpoint does not yet.";
const TOTP_SOON_NOTE =
  "Authenticator 2FA needs new secret storage and login challenge — use passkeys today.";
const CLOSE_SOON_NOTE =
  "`users.disabled_at` exists for disable, but there is no self-serve close route yet.";

const SESSION_TOKEN = "account-session-token-coming-soon";

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
    displayName: "Aom",
    avatarColor: "#0f766e",
    locale: "th-TH",
    timezone: "Asia/Bangkok",
    homeCity: "Bangkok",
    homeCountry: "Thailand",
    primaryEmail: "aom@joii.app",
  },
  passkeys: [],
  trustedDevices: [],
};

const originalFetch = globalThis.fetch;

vi.mock("next/navigation", () => ({
  usePathname: () => "/portal/settings",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
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

function urlString(url: RequestInfo | URL): string {
  return typeof url === "string" ? url : url.toString();
}

/** OAuth / provider connect endpoints that Coming soon must never hit. */
function isOAuthishUrl(url: RequestInfo | URL): boolean {
  const raw = urlString(url).toLowerCase();
  return (
    raw.includes("oauth") ||
    raw.includes("google") ||
    raw.includes("instagram") ||
    raw.includes("facebook") ||
    raw.includes("/line") ||
    raw.includes("connect")
  );
}

function mutatingAccountCalls(
  fetchMock: ReturnType<typeof vi.fn>,
): Array<{ method: string; path: string }> {
  return fetchMock.mock.calls
    .map(([url, init]) => ({
      method: String((init as RequestInit | undefined)?.method ?? "GET").toUpperCase(),
      path: pathOf(url!),
    }))
    .filter(
      ({ method, path }) =>
        path.startsWith("/api/v1/account") && method !== "GET",
    );
}

describe("AccountSettingsComingSoon Connections", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({ error: { message: "unexpected" } }, 404),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
  });

  it("Connections lists Google Drive, Google Photos, Instagram, Facebook, LINE with Soon tags and disabled Connect buttons; no OAuth fetch or success toast on interact", () => {
    render(<AccountSettingsComingSoon />);

    const connections = screen.getByRole("region", { name: "Connections" });
    expect(within(connections).getByText(CONNECTIONS_SOON_NOTE)).toBeInTheDocument();

    for (const name of CONNECTION_PROVIDERS) {
      expect(within(connections).getByText(name)).toBeInTheDocument();
    }

    const soonTags = within(connections).getAllByText(/^Soon$/);
    expect(soonTags).toHaveLength(CONNECTION_PROVIDERS.length);

    const connectButtons = within(connections).getAllByRole("button", {
      name: /^Connect$/,
    });
    expect(connectButtons).toHaveLength(CONNECTION_PROVIDERS.length);
    for (const btn of connectButtons) {
      expect(btn).toBeDisabled();
    }

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const callsBefore = fetchMock.mock.calls.length;

    // Force-click disabled Connect controls — must not invent OAuth or success chrome.
    for (const btn of connectButtons) {
      fireEvent.click(btn);
    }

    const newCalls = fetchMock.mock.calls.slice(callsBefore);
    expect(newCalls.filter(([url]) => isOAuthishUrl(url!))).toHaveLength(0);
    expect(screen.queryByText(/^Connected$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Saved$/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/connected successfully/i),
    ).not.toBeInTheDocument();
  });
});

describe("AccountSettingsComingSoon Security", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({ error: { message: "unexpected" } }, 404),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
  });

  it("Security accordions Email, Password, Two-factor (TOTP), Close account show Coming soon tags + soon-notes; controls inside are non-acting (disabled / no PATCH/POST)", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsComingSoon />);

    const security = screen.getByRole("region", { name: "Security" });

    for (const title of SECURITY_ACCORDIONS) {
      const summary = within(security).getByText(title, { exact: true });
      const accordion = summary.closest("details");
      expect(accordion).toBeTruthy();
      expect(
        within(accordion as HTMLElement).getByText(/^Coming soon$/),
      ).toBeInTheDocument();
    }

    // Expand each coming-soon accordion and assert soon-notes + non-acting controls.
    const notesByTitle: Record<(typeof SECURITY_ACCORDIONS)[number], string> = {
      Email: EMAIL_SOON_NOTE,
      Password: PASSWORD_SOON_NOTE,
      "Two-factor (TOTP)": TOTP_SOON_NOTE,
      "Close account": CLOSE_SOON_NOTE,
    };

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const callsBefore = fetchMock.mock.calls.length;

    for (const title of SECURITY_ACCORDIONS) {
      const summary = within(security).getByText(title, { exact: true });
      const accordion = summary.closest("details") as HTMLDetailsElement;
      const summaryEl = accordion.querySelector("summary");
      expect(summaryEl).toBeTruthy();
      await user.click(summaryEl!);

      expect(within(accordion).getByText(notesByTitle[title])).toBeInTheDocument();

      const actionable = within(accordion).queryAllByRole("button");
      for (const btn of actionable) {
        expect(btn).toBeDisabled();
        fireEvent.click(btn);
      }

      const fields = within(accordion).queryAllByRole("textbox");
      for (const field of fields) {
        const input = field as HTMLInputElement;
        // draft-v2: current email is read-only; other controls stay disabled.
        expect(input.disabled || input.readOnly).toBe(true);
      }
    }

    const newCalls = fetchMock.mock.calls.slice(callsBefore);
    expect(
      newCalls.filter(
        ([url, init]) =>
          isOAuthishUrl(url!) ||
          String((init as RequestInit | undefined)?.method ?? "GET").toUpperCase() !==
            "GET",
      ),
    ).toHaveLength(0);
    expect(mutatingAccountCalls(fetchMock)).toHaveLength(0);
    expect(screen.queryByText(/^Saved$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Connected$/)).not.toBeInTheDocument();
  });

  it("securityAfterTotp renders after TOTP and before Close account (Email → Password → TOTP → live → Close)", () => {
    render(
      <AccountSettingsComingSoon
        securityAfterTotp={
          <>
            <details className="account-settings-acc">
              <summary>
                <span className="account-settings-acc-heading">
                  <span>Passkeys</span>
                </span>
              </summary>
            </details>
            <details className="account-settings-acc">
              <summary>
                <span className="account-settings-acc-heading">
                  <span>Trusted devices</span>
                </span>
              </summary>
            </details>
          </>
        }
      />,
    );

    const security = screen.getByRole("region", { name: "Security" });
    const ordered = Array.from(
      security.querySelectorAll("details .account-settings-acc-heading > span:first-child"),
    ).map((el) => el.textContent?.trim() ?? "");

    expect(ordered).toEqual([
      "Email",
      "Password",
      "Two-factor (TOTP)",
      "Passkeys",
      "Trusted devices",
      "Close account",
    ]);
  });
});

describe("AccountSettingsPage wires Coming soon chrome", () => {
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

  it("after load, page renders Connections and Security Coming soon regions from AccountSettingsComingSoon", async () => {
    render(<AccountSettingsPage />);

    await waitFor(() => screen.getByRole("region", { name: "Identity" }));

    const connections = await waitFor(() =>
      screen.getByRole("region", { name: "Connections" }),
    );
    expect(within(connections).getByText("Google Drive")).toBeInTheDocument();
    expect(
      within(connections).getAllByRole("button", { name: /^Connect$/ }).length,
    ).toBe(CONNECTION_PROVIDERS.length);

    const security = screen.getByRole("region", { name: "Security" });
    expect(within(security).getByText("Email", { exact: true })).toBeInTheDocument();
    expect(
      within(security).getByText("Two-factor (TOTP)", { exact: true }),
    ).toBeInTheDocument();
  });
});
