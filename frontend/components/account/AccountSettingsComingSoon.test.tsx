/**
 * Account settings Coming soon — Connections + Security chrome (draft-v4).
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 *
 * Public surface: AccountSettingsComingSoon (and AccountSettingsPage wiring).
 * Scope lock: compact non-acting stubs only — no OAuth / email-change / TOTP API.
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

/** Independent literals — Connections compact stub (draft-v4). */
const CONNECTIONS_STUB_HEADING = "Google Drive, Photos, and social accounts";
const CONNECTIONS_STUB_BODY =
  "Connect libraries and social accounts later. Trip album links can still use Google providers as URLs today.";

/** Independent literals — Security Coming soon accordions (draft-v4; Password + Close are live). */
const SECURITY_COMING_SOON_ACCORDIONS = [
  "Email",
  "Two-factor (TOTP)",
] as const;

/** Independent literals — Close account live danger dialog (draft-v4 / T4). */
const CLOSE_ACCORDION_TITLE = "Close account";
const CLOSE_OPEN_LABEL = "Close account…";
const CLOSE_DIALOG_TITLE = "Close account?";
const CLOSE_PASSWORD_LABEL = "Password";
const CLOSE_CONFIRM_LABEL = "Confirmation";
const CLOSE_CONFIRM_VALUE = "CLOSE";
const CLOSE_CONFIRM_BUTTON = "Close account";
const CANCEL_LABEL = "Cancel";
const CLOSE_DANGER_CALLOUT =
  "This disables your account and signs you out everywhere. Trip data is not hard-deleted — transfer ownership of trips you own first when needed.";

/** Independent literals — Password live form (draft-v4). */
const PASSWORD_ACCORDION_TITLE = "Password";
const CURRENT_PASSWORD_LABEL = "Current password";
const NEW_PASSWORD_LABEL = "New password";
const CONFIRM_PASSWORD_LABEL = "Confirm new password";
const UPDATE_PASSWORD_LABEL = "Update password";
const PASSWORD_HINT = "Uses a separate Update action. Minimum 8 characters.";

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

  it("Connections is a compact Coming soon stub (draft-v4): section Coming soon tag + stub copy; no Connect rows / OAuth fetch", () => {
    render(<AccountSettingsComingSoon />);

    const connections = screen.getByRole("region", { name: /Connections/i });
    expect(within(connections).getByText(/^Coming soon$/)).toBeInTheDocument();
    expect(
      within(connections).getByText(CONNECTIONS_STUB_HEADING),
    ).toBeInTheDocument();
    expect(
      within(connections).getByText(CONNECTIONS_STUB_BODY),
    ).toBeInTheDocument();

    // No fake per-provider Connect rows (draft-v4 compact stub).
    expect(
      within(connections).queryAllByRole("button", { name: /^Connect$/ }),
    ).toHaveLength(0);
    expect(within(connections).queryByText(/^Soon$/)).not.toBeInTheDocument();
    expect(within(connections).queryByText("Libraries")).not.toBeInTheDocument();
    expect(within(connections).queryByText("Instagram")).not.toBeInTheDocument();
    expect(within(connections).queryByText("Facebook")).not.toBeInTheDocument();
    expect(within(connections).queryByText("LINE")).not.toBeInTheDocument();

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const callsBefore = fetchMock.mock.calls.length;
    fireEvent.click(connections);
    const newCalls = fetchMock.mock.calls.slice(callsBefore);
    expect(newCalls.filter(([url]) => isOAuthishUrl(url!))).toHaveLength(0);
    expect(screen.queryByText(/^Connected$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Saved$/)).not.toBeInTheDocument();
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

  it("Security Email and Two-factor (TOTP) are summary-only Coming soon stubs (draft-v4); expand yields no fields/actions and no email/TOTP API", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsComingSoon primaryEmail="aom@joii.app" />);

    const security = screen.getByRole("region", { name: "Security" });

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const callsBefore = fetchMock.mock.calls.length;

    for (const title of SECURITY_COMING_SOON_ACCORDIONS) {
      const summary = within(security).getByText(title, { exact: true });
      const accordion = summary.closest("details") as HTMLDetailsElement;
      expect(accordion).toBeTruthy();
      expect(
        within(accordion).getByText(/^Coming soon$/),
      ).toBeInTheDocument();

      const summaryEl = accordion.querySelector("summary");
      expect(summaryEl).toBeTruthy();
      await user.click(summaryEl!);

      // Summary-only: no body fields, buttons, or API-jargon soon-notes.
      expect(within(accordion).queryAllByRole("button")).toHaveLength(0);
      expect(within(accordion).queryAllByRole("textbox")).toHaveLength(0);
      expect(
        within(accordion).queryByLabelText(/current/i),
      ).not.toBeInTheDocument();
      expect(accordion.textContent ?? "").not.toMatch(/\bAPI\b/);
      expect(accordion.textContent ?? "").not.toMatch(/challenge/i);
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

  it("Close account accordion is live (not Coming soon): opens danger dialog requiring Password + typing CLOSE", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsComingSoon sessionToken={SESSION_TOKEN} />);

    const security = screen.getByRole("region", { name: "Security" });
    const summary = within(security).getByText(CLOSE_ACCORDION_TITLE, {
      exact: true,
    });
    const accordion = summary.closest("details") as HTMLDetailsElement;
    expect(accordion).toBeTruthy();

    // Live close: no Coming soon chrome (draft-v4 Close accordion).
    expect(
      Boolean(within(accordion).queryByText(/^Coming soon$/)),
    ).toBe(false);
    expect(
      Boolean(
        within(accordion).queryByText(/no self-serve close route yet/i),
      ),
    ).toBe(false);

    const summaryEl = accordion.querySelector("summary");
    expect(summaryEl).toBeTruthy();
    await user.click(summaryEl!);

    expect(within(accordion).getByText(CLOSE_DANGER_CALLOUT)).toBeInTheDocument();
    const openBtn = within(accordion).getByRole("button", {
      name: CLOSE_OPEN_LABEL,
    });
    expect((openBtn as HTMLButtonElement).disabled).toBe(false);

    await user.click(openBtn);

    const dialog = await screen.findByRole("dialog", {
      name: CLOSE_DIALOG_TITLE,
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    expect(
      within(dialog).getByLabelText(CLOSE_PASSWORD_LABEL),
    ).toBeInTheDocument();
    const confirmField = within(dialog).getByLabelText(CLOSE_CONFIRM_LABEL);
    expect(confirmField).toBeInTheDocument();
    expect((confirmField as HTMLInputElement).placeholder).toBe(
      CLOSE_CONFIRM_VALUE,
    );

    const cancel = within(dialog).getByRole("button", { name: CANCEL_LABEL });
    const confirm = within(dialog).getByRole("button", {
      name: CLOSE_CONFIRM_BUTTON,
    });
    // Cancel-first: Cancel precedes destructive confirm in DOM order.
    expect(
      cancel.compareDocumentPosition(confirm) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // Confirm stays disabled until password + exact CLOSE.
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    await user.type(
      within(dialog).getByLabelText(CLOSE_PASSWORD_LABEL),
      "any-password",
    );
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    await user.type(confirmField, CLOSE_CONFIRM_VALUE);
    expect((confirm as HTMLButtonElement).disabled).toBe(false);

    // Opening alone must not POST /account/close.
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    expect(
      fetchMock.mock.calls.filter(
        ([url, init]) =>
          pathOf(url!) === "/api/v1/account/close" &&
          String((init as RequestInit | undefined)?.method ?? "GET").toUpperCase() ===
            "POST",
      ),
    ).toHaveLength(0);

    // Email / TOTP remain Coming soon while Close is live.
    for (const title of SECURITY_COMING_SOON_ACCORDIONS) {
      const soonSummary = within(security).getByText(title, { exact: true });
      const soonAccordion = soonSummary.closest("details") as HTMLElement;
      expect(
        Boolean(within(soonAccordion).queryByText(/^Coming soon$/)),
      ).toBe(true);
    }
  });

  it("Password accordion is live inline form (not Coming soon) with Current/New/Confirm fields and Update password", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsComingSoon />);

    const security = screen.getByRole("region", { name: "Security" });
    const summary = within(security).getByText(PASSWORD_ACCORDION_TITLE, {
      exact: true,
    });
    const accordion = summary.closest("details") as HTMLDetailsElement;
    expect(accordion).toBeTruthy();

    // Live form: no Coming soon chrome (draft-v4 Password accordion).
    // Boolean asserts avoid happy-dom element serialization on failure.
    expect(
      Boolean(within(accordion).queryByText(/^Coming soon$/)),
    ).toBe(false);
    expect(
      Boolean(
        within(accordion).queryByText(/change-password endpoint does not yet/i),
      ),
    ).toBe(false);

    const summaryEl = accordion.querySelector("summary");
    expect(summaryEl).toBeTruthy();
    await user.click(summaryEl!);

    const bodyText = accordion.textContent ?? "";
    expect(bodyText).toContain(CURRENT_PASSWORD_LABEL);
    expect(bodyText).toContain(NEW_PASSWORD_LABEL);
    expect(bodyText).toContain(CONFIRM_PASSWORD_LABEL);
    expect(bodyText).toContain(UPDATE_PASSWORD_LABEL);
    expect(bodyText).toContain(PASSWORD_HINT);

    const update = within(accordion).getByRole("button", {
      name: UPDATE_PASSWORD_LABEL,
    });
    expect(update).toBeEnabled();
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

  it("after load, page renders Connections compact stub and Security Coming soon Email/TOTP from AccountSettingsComingSoon", async () => {
    render(<AccountSettingsPage />);

    await waitFor(() => screen.getByRole("region", { name: "Identity" }));

    const connections = await waitFor(() =>
      screen.getByRole("region", { name: /Connections/i }),
    );
    expect(
      within(connections).getByText(CONNECTIONS_STUB_HEADING),
    ).toBeInTheDocument();
    expect(
      within(connections).queryAllByRole("button", { name: /^Connect$/ }),
    ).toHaveLength(0);

    const security = screen.getByRole("region", { name: "Security" });
    expect(within(security).getByText("Email", { exact: true })).toBeInTheDocument();
    expect(
      within(security).getByText("Two-factor (TOTP)", { exact: true }),
    ).toBeInTheDocument();
  });
});
