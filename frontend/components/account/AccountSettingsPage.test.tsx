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
