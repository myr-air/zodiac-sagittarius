/**
 * Account settings Trusted devices — list + Revoke (draft-v2).
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL.
 *
 * Public surface: AccountSettingsPage after GET /account. Revoke wires
 * revokeTrustedDevice then removes/reloads that device.
 *
 * A3 / TDD triage (skip-TDD): draft-v2 has no Logout control (decisions.md).
 * Do not invent logout chrome. The omit test below documents that — it is
 * already satisfied without implementation and is not a RED gate for T6.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
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

/** Independent literals — draft-v2 Trusted devices list + last-seen copy. */
const DEVICE_LABEL_A = "Studio Mac";
const DEVICE_LABEL_B = "Travel iPad";
const DEVICE_ID_A = "018f4e80-0000-7000-a000-0000000000da";
const DEVICE_ID_B = "018f4e80-0000-7000-a000-0000000000db";
const USER_AGENT_A = "Chrome";
const USER_AGENT_B = "Safari";
/** Fixed last-seen display (absolute — avoids flaky relative "2h ago"). */
const LAST_SEEN_A = "Last seen May 30, 2026";
const LAST_SEEN_NEVER = "Never seen";
const EMPTY_DEVICES = "No trusted devices.";
const REVOKE_LABEL = "Revoke";
const DEVICES_HINT =
  "Revoke uses existing DELETE /account/trusted-devices/{id}.";
const REVOKE_ERROR = "Could not revoke this device. Please try again.";

const SESSION_TOKEN = "account-session-token-devices";

const ACCOUNT_SESSION = {
  userId: "018f4e80-0000-7000-a000-000000000001",
  sessionToken: SESSION_TOKEN,
  kind: "temporary" as const,
  trustedDeviceId: null,
  createdAt: "2026-07-19T00:00:00Z",
  expiresAt: "2026-07-20T00:00:00Z",
};

const PROFILE = {
  id: ACCOUNT_SESSION.userId,
  displayName: "Aom",
  avatarColor: "#0f766e",
  locale: "th-TH",
  timezone: "Asia/Bangkok",
  homeCity: "Bangkok",
  homeCountry: "Thailand",
  primaryEmail: "aom@joii.app",
};

const DEVICES_FIXTURE = [
  {
    id: DEVICE_ID_A,
    label: DEVICE_LABEL_A,
    userAgent: USER_AGENT_A,
    createdAt: "2026-05-30T01:00:00Z",
    lastSeenAt: "2026-05-30T02:00:00Z",
  },
  {
    id: DEVICE_ID_B,
    label: DEVICE_LABEL_B,
    userAgent: USER_AGENT_B,
    createdAt: "2026-01-02T00:00:00Z",
    lastSeenAt: null,
  },
] as const;

const ACCOUNT_SETTINGS_WITH_DEVICES = {
  profile: PROFILE,
  passkeys: [],
  trustedDevices: [...DEVICES_FIXTURE],
};

const ACCOUNT_SETTINGS_EMPTY_DEVICES = {
  profile: PROFILE,
  passkeys: [],
  trustedDevices: [] as [],
};

const ACCOUNT_SETTINGS_AFTER_REVOKE = {
  profile: PROFILE,
  passkeys: [],
  trustedDevices: [
    {
      id: DEVICE_ID_B,
      label: DEVICE_LABEL_B,
      userAgent: USER_AGENT_B,
      createdAt: "2026-01-02T00:00:00Z",
      lastSeenAt: null,
    },
  ],
};

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

const originalFetch = globalThis.fetch;

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

function accountGetCalls(fetchMock: ReturnType<typeof vi.fn>): number {
  return fetchMock.mock.calls.filter(([url, init]) => {
    const method = String(
      (init as RequestInit | undefined)?.method ?? "GET",
    ).toUpperCase();
    return pathOf(url!) === "/api/v1/account" && method === "GET";
  }).length;
}

function devicesAccordion(): HTMLElement {
  const summary = screen.getByText("Trusted devices", { exact: true });
  const accordion = summary.closest("details");
  expect(accordion).toBeTruthy();
  return accordion as HTMLElement;
}

async function renderLoadedSettings(
  body: unknown,
  fetchImpl?: typeof fetch,
) {
  window.localStorage.clear();
  saveAccountSession(window.localStorage, ACCOUNT_SESSION);
  expect(window.localStorage.getItem(ACCOUNT_SESSION_STORAGE_KEY)).toBeTruthy();

  globalThis.fetch = (fetchImpl ??
    (vi.fn(async (input) => {
      if (pathOf(input) === "/api/v1/account") {
        return jsonResponse(body);
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    }) as typeof fetch));

  render(<AccountSettingsPage />);
  await waitFor(() => screen.getByRole("region", { name: "Identity" }));
}

describe("AccountSettingsDevices list + empty", () => {
  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.localStorage.clear();
  });

  it("Trusted devices accordion lists label + userAgent/lastSeen from settings.trustedDevices", async () => {
    await renderLoadedSettings(ACCOUNT_SETTINGS_WITH_DEVICES);

    const security = screen.getByRole("region", { name: "Security" });
    expect(
      within(security).getByText("Trusted devices", { exact: true }),
    ).toBeInTheDocument();

    const accordion = devicesAccordion();
    // Live Trusted devices accordion — summary must not carry a Coming soon tag.
    const summary = accordion.querySelector("summary");
    expect(summary).toBeTruthy();
    expect(summary!.textContent ?? "").not.toMatch(/Coming soon/i);

    expect(within(accordion).getByText(DEVICE_LABEL_A)).toBeInTheDocument();
    expect(within(accordion).getByText(USER_AGENT_A)).toBeInTheDocument();
    expect(within(accordion).getByText(LAST_SEEN_A)).toBeInTheDocument();
    expect(within(accordion).getByText(DEVICE_LABEL_B)).toBeInTheDocument();
    expect(within(accordion).getByText(USER_AGENT_B)).toBeInTheDocument();
    expect(within(accordion).getByText(LAST_SEEN_NEVER)).toBeInTheDocument();
    expect(within(accordion).getByText(DEVICES_HINT)).toBeInTheDocument();

    cleanup();
    await renderLoadedSettings(ACCOUNT_SETTINGS_EMPTY_DEVICES);
    const emptyAccordion = devicesAccordion();
    expect(within(emptyAccordion).getByText(EMPTY_DEVICES)).toBeInTheDocument();
    expect(
      within(emptyAccordion).queryByText(DEVICE_LABEL_A),
    ).not.toBeInTheDocument();
  });
});

describe("AccountSettingsDevices Revoke", () => {
  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.localStorage.clear();
  });

  it("Revoke calls revokeTrustedDevice then removes/reloads that device; failure shows visible error without fake success toast", async () => {
    const user = userEvent.setup();

    let accountGets = 0;
    const fetchMock = vi.fn(async (input, init) => {
      const path = pathOf(input);
      const method = String(init?.method ?? "GET").toUpperCase();

      if (path === "/api/v1/account" && method === "GET") {
        accountGets += 1;
        return jsonResponse(
          accountGets === 1
            ? ACCOUNT_SETTINGS_WITH_DEVICES
            : ACCOUNT_SETTINGS_AFTER_REVOKE,
        );
      }
      if (
        path === `/api/v1/account/trusted-devices/${DEVICE_ID_A}` &&
        method === "DELETE"
      ) {
        return new Response(null, { status: 204 });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    await renderLoadedSettings(ACCOUNT_SETTINGS_WITH_DEVICES, fetchMock);

    const accordion = devicesAccordion();
    expect(within(accordion).getByText(DEVICE_LABEL_A)).toBeInTheDocument();

    const getsBeforeRevoke = accountGetCalls(fetchMock);
    const revokeButtons = within(accordion).getAllByRole("button", {
      name: REVOKE_LABEL,
    });
    expect(revokeButtons).toHaveLength(DEVICES_FIXTURE.length);

    // Revoke first device (Studio Mac).
    await user.click(revokeButtons[0]!);

    const deleteCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        pathOf(url!) === `/api/v1/account/trusted-devices/${DEVICE_ID_A}` &&
        String(init?.method ?? "GET").toUpperCase() === "DELETE",
    );
    expect(deleteCall).toBeTruthy();
    expect(new Headers(deleteCall![1]?.headers).get("Authorization")).toBe(
      `Bearer ${SESSION_TOKEN}`,
    );

    await waitFor(() => {
      expect(accountGetCalls(fetchMock)).toBeGreaterThan(getsBeforeRevoke);
    });
    await waitFor(() => {
      expect(screen.queryByText(DEVICE_LABEL_A)).not.toBeInTheDocument();
    });
    expect(screen.getByText(DEVICE_LABEL_B)).toBeInTheDocument();
    expect(screen.queryByText(/device revoked/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Saved$/)).not.toBeInTheDocument();

    // Error path: DELETE failure → inline alert, no fake success, device stays.
    cleanup();
    const errorFetch = vi.fn(async (input, init) => {
      const path = pathOf(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (path === "/api/v1/account" && method === "GET") {
        return jsonResponse(ACCOUNT_SETTINGS_WITH_DEVICES);
      }
      if (
        path === `/api/v1/account/trusted-devices/${DEVICE_ID_A}` &&
        method === "DELETE"
      ) {
        return jsonResponse({ error: { message: REVOKE_ERROR } }, 400);
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    await renderLoadedSettings(ACCOUNT_SETTINGS_WITH_DEVICES, errorFetch);
    const errAccordion = devicesAccordion();
    const errRevoke = within(errAccordion).getAllByRole("button", {
      name: REVOKE_LABEL,
    })[0]!;
    await user.click(errRevoke);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(REVOKE_ERROR);
    });
    expect(screen.getByText(DEVICE_LABEL_A)).toBeInTheDocument();
    expect(screen.queryByText(/device revoked/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Saved$/)).not.toBeInTheDocument();
    // Failed revoke must not trigger a reload that would hide the device.
    expect(
      errorFetch.mock.calls.filter(
        ([url, init]) =>
          pathOf(url!) === "/api/v1/account" &&
          String(init?.method ?? "GET").toUpperCase() === "GET",
      ),
    ).toHaveLength(1);
  });
});

/**
 * A3 skip-TDD: draft-v2 has no Logout chrome (see decisions.md).
 * This test documents the omit — already green without implementing logout UI.
 * If a Logout control is later added to the draft, replace with wiring tests
 * for logoutAccountSession + clear session storage + navigate away.
 */
describe("AccountSettingsDevices Logout omit (A3 skip-TDD)", () => {
  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.localStorage.clear();
  });

  it("Settings page does not invent Logout chrome absent from draft-v2", async () => {
    await renderLoadedSettings(ACCOUNT_SETTINGS_WITH_DEVICES);

    expect(
      screen.queryByRole("button", { name: /^Logout$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Log out$/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/^Logout$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Log out$/i)).not.toBeInTheDocument();
  });
});
