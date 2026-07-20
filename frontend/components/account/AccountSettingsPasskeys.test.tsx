/**
 * Account settings Passkeys — list + Add (registerPasskey) + Remove Coming soon
 * (draft-v2). DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL.
 *
 * Public surface: AccountSettingsPage after GET /account. Add wires
 * registerPasskey (options → WebAuthn create → finish) then reloads settings.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
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
import { AccountSettingsPage } from "./AccountSettingsPage";

/** Independent literals — draft-v2 Passkeys list + empty / last-used copy. */
const PASSKEY_NICKNAME_A = "MacBook Touch ID";
const PASSKEY_NICKNAME_B = "iPhone";
const PASSKEY_ID_A = "018f4e80-0000-7000-a000-0000000000aa";
const PASSKEY_ID_B = "018f4e80-0000-7000-a000-0000000000bb";
/** Fixed last-used display (absolute — avoids flaky relative "yesterday"). */
const LAST_USED_A = "Last used May 30, 2026";
const LAST_USED_NEVER = "Never used";
const EMPTY_PASSKEYS = "No passkeys yet.";
const ADD_PASSKEY_LABEL = "Add passkey";
const NEW_PASSKEY_NICKNAME = "Travel laptop";
const REGISTER_ERROR = "Could not start passkey registration. Please try again.";
const PASSKEYS_HINT =
  "Add is live. Remove passkey is Coming soon (no DELETE route yet).";

const SESSION_TOKEN = "account-session-token-passkeys";
const CHALLENGE_ID = "018f4e80-0000-7000-a000-0000000000cc";
/** Valid base64url challenge token (independent fixture). */
const CHALLENGE = "cmVnaXN0ZXItY2hhbGxlbmdl";
const CREDENTIAL_ID = "cmVnaXN0ZXItY3JlZGVudGlhbA";
const CLIENT_DATA_JSON = "client-data-json-create-bytes";
const ATTESTATION_OBJECT = "attestation-object-bytes";
const NEW_PASSKEY_ID = "018f4e80-0000-7000-a000-0000000000dd";

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

const PASSKEYS_FIXTURE = [
  {
    id: PASSKEY_ID_A,
    nickname: PASSKEY_NICKNAME_A,
    createdAt: "2026-05-30T01:00:00Z",
    lastUsedAt: "2026-05-30T02:00:00Z",
  },
  {
    id: PASSKEY_ID_B,
    nickname: PASSKEY_NICKNAME_B,
    createdAt: "2026-01-02T00:00:00Z",
    lastUsedAt: null,
  },
] as const;

const ACCOUNT_SETTINGS_WITH_PASSKEYS = {
  profile: PROFILE,
  passkeys: [...PASSKEYS_FIXTURE],
  trustedDevices: [],
};

const ACCOUNT_SETTINGS_EMPTY_PASSKEYS = {
  profile: PROFILE,
  passkeys: [] as [],
  trustedDevices: [],
};

const ACCOUNT_SETTINGS_AFTER_ADD = {
  profile: PROFILE,
  passkeys: [
    {
      id: NEW_PASSKEY_ID,
      nickname: NEW_PASSKEY_NICKNAME,
      createdAt: "2026-07-20T12:00:00Z",
      lastUsedAt: null,
    },
  ],
  trustedDevices: [],
};

const OPTIONS_BODY = {
  challengeId: CHALLENGE_ID,
  challenge: CHALLENGE,
  expiresAt: "2026-07-20T12:15:00Z",
};

const FINISH_BODY = {
  id: NEW_PASSKEY_ID,
  nickname: NEW_PASSKEY_NICKNAME,
  createdAt: "2026-07-20T12:00:00Z",
  lastUsedAt: null,
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

function utf8Buffer(value: string): ArrayBuffer {
  return new TextEncoder().encode(value).buffer;
}

function accountGetCalls(fetchMock: ReturnType<typeof vi.fn>): number {
  return fetchMock.mock.calls.filter(([url, init]) => {
    const method = String(
      (init as RequestInit | undefined)?.method ?? "GET",
    ).toUpperCase();
    return pathOf(url!) === "/api/v1/account" && method === "GET";
  }).length;
}

function passkeyDeleteCalls(
  fetchMock: ReturnType<typeof vi.fn>,
): Array<{ method: string; path: string }> {
  return fetchMock.mock.calls
    .map(([url, init]) => ({
      method: String(
        (init as RequestInit | undefined)?.method ?? "GET",
      ).toUpperCase(),
      path: pathOf(url!),
    }))
    .filter(
      ({ method, path }) =>
        method === "DELETE" &&
        (path.startsWith("/api/v1/account/passkeys") ||
          path.includes("/passkeys/")),
    );
}

function passkeysAccordion(): HTMLElement {
  const summary = screen.getByText("Passkeys", { exact: true });
  const accordion = summary.closest("details");
  expect(accordion).toBeTruthy();
  return accordion as HTMLElement;
}

function installWebAuthnCreate(
  create: ReturnType<typeof vi.fn>,
): () => void {
  const previous = globalThis.navigator.credentials;
  Object.defineProperty(globalThis.navigator, "credentials", {
    configurable: true,
    value: { create },
  });
  return () => {
    Object.defineProperty(globalThis.navigator, "credentials", {
      configurable: true,
      value: previous,
    });
  };
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

describe("AccountSettingsPasskeys list + empty", () => {
  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.localStorage.clear();
  });

  it("Passkeys accordion lists nickname + last-used from settings.passkeys; empty state is clear", async () => {
    await renderLoadedSettings(ACCOUNT_SETTINGS_WITH_PASSKEYS);

    const security = screen.getByRole("region", { name: "Security" });
    expect(
      within(security).getByText("Passkeys", { exact: true }),
    ).toBeInTheDocument();

    const accordion = passkeysAccordion();
    // Live Passkeys accordion — summary must not carry a Coming soon tag.
    const summary = accordion.querySelector("summary");
    expect(summary).toBeTruthy();
    expect(summary!.textContent ?? "").not.toMatch(/Coming soon/i);

    expect(within(accordion).getByText(PASSKEY_NICKNAME_A)).toBeInTheDocument();
    expect(within(accordion).getByText(LAST_USED_A)).toBeInTheDocument();
    expect(within(accordion).getByText(PASSKEY_NICKNAME_B)).toBeInTheDocument();
    expect(within(accordion).getByText(LAST_USED_NEVER)).toBeInTheDocument();
    expect(within(accordion).getByText(PASSKEYS_HINT)).toBeInTheDocument();

    cleanup();
    await renderLoadedSettings(ACCOUNT_SETTINGS_EMPTY_PASSKEYS);
    const emptyAccordion = passkeysAccordion();
    expect(within(emptyAccordion).getByText(EMPTY_PASSKEYS)).toBeInTheDocument();
    expect(
      within(emptyAccordion).queryByText(PASSKEY_NICKNAME_A),
    ).not.toBeInTheDocument();
  });
});

describe("AccountSettingsPasskeys Add", () => {
  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.localStorage.clear();
  });

  it("Add passkey calls registerPasskey (options → WebAuthn create → finish) then reloads settings; errors show inline without fake success", async () => {
    const user = userEvent.setup();
    const createCredential = vi.fn(async () => ({
      id: CREDENTIAL_ID,
      rawId: utf8Buffer(CREDENTIAL_ID),
      type: "public-key",
      response: {
        clientDataJSON: utf8Buffer(CLIENT_DATA_JSON),
        attestationObject: utf8Buffer(ATTESTATION_OBJECT),
      },
    }));
    const restoreCredentials = installWebAuthnCreate(createCredential);

    try {
      let accountGets = 0;
      const fetchMock = vi.fn(async (input, init) => {
        const path = pathOf(input);
        const method = String(init?.method ?? "GET").toUpperCase();

        if (path === "/api/v1/account" && method === "GET") {
          accountGets += 1;
          return jsonResponse(
            accountGets === 1
              ? ACCOUNT_SETTINGS_EMPTY_PASSKEYS
              : ACCOUNT_SETTINGS_AFTER_ADD,
          );
        }
        if (path === "/api/v1/account/passkeys/options" && method === "POST") {
          return jsonResponse(OPTIONS_BODY);
        }
        if (path === "/api/v1/account/passkeys" && method === "POST") {
          return jsonResponse(FINISH_BODY);
        }
        return jsonResponse({ error: { message: "unexpected" } }, 404);
      });

      await renderLoadedSettings(ACCOUNT_SETTINGS_EMPTY_PASSKEYS, fetchMock);

      const accordion = passkeysAccordion();
      const nickname = within(accordion).getByLabelText(/nickname/i);
      await user.clear(nickname);
      await user.type(nickname, NEW_PASSKEY_NICKNAME);

      const getsBeforeAdd = accountGetCalls(fetchMock);
      await user.click(
        within(accordion).getByRole("button", { name: ADD_PASSKEY_LABEL }),
      );

      await waitFor(() => {
        expect(createCredential).toHaveBeenCalledTimes(1);
      });

      const optionsCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          pathOf(url!) === "/api/v1/account/passkeys/options" &&
          String(init?.method ?? "GET").toUpperCase() === "POST",
      );
      expect(optionsCall).toBeTruthy();
      expect(new Headers(optionsCall![1]?.headers).get("Authorization")).toBe(
        `Bearer ${SESSION_TOKEN}`,
      );

      const finishCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          pathOf(url!) === "/api/v1/account/passkeys" &&
          String(init?.method ?? "GET").toUpperCase() === "POST",
      );
      expect(finishCall).toBeTruthy();
      expect(new Headers(finishCall![1]?.headers).get("Authorization")).toBe(
        `Bearer ${SESSION_TOKEN}`,
      );
      const finishBody = JSON.parse(String(finishCall![1]?.body)) as Record<
        string,
        unknown
      >;
      expect(finishBody.nickname).toBe(NEW_PASSKEY_NICKNAME);
      expect(finishBody.challengeId).toBe(CHALLENGE_ID);

      // options → create → finish order
      const optionsIdx = fetchMock.mock.calls.indexOf(optionsCall!);
      const finishIdx = fetchMock.mock.calls.indexOf(finishCall!);
      expect(optionsIdx).toBeLessThan(finishIdx);

      await waitFor(() => {
        expect(accountGetCalls(fetchMock)).toBeGreaterThan(getsBeforeAdd);
      });
      await waitFor(() => {
        expect(screen.getByText(NEW_PASSKEY_NICKNAME)).toBeInTheDocument();
      });
      expect(screen.queryByText(/passkey added/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Saved$/)).not.toBeInTheDocument();

      // Error path: options failure → inline alert, no fake success, no finish POST.
      cleanup();
      const createOnError = vi.fn();
      restoreCredentials();
      const restoreErrCreds = installWebAuthnCreate(createOnError);
      try {
        const errorFetch = vi.fn(async (input, init) => {
          const path = pathOf(input);
          const method = String(init?.method ?? "GET").toUpperCase();
          if (path === "/api/v1/account" && method === "GET") {
            return jsonResponse(ACCOUNT_SETTINGS_EMPTY_PASSKEYS);
          }
          if (path === "/api/v1/account/passkeys/options" && method === "POST") {
            return jsonResponse({ error: { message: REGISTER_ERROR } }, 400);
          }
          return jsonResponse({ error: { message: "unexpected" } }, 404);
        });

        await renderLoadedSettings(ACCOUNT_SETTINGS_EMPTY_PASSKEYS, errorFetch);
        const errAccordion = passkeysAccordion();
        const errNickname = within(errAccordion).getByLabelText(/nickname/i);
        await user.clear(errNickname);
        await user.type(errNickname, NEW_PASSKEY_NICKNAME);
        await user.click(
          within(errAccordion).getByRole("button", { name: ADD_PASSKEY_LABEL }),
        );

        await waitFor(() => {
          expect(screen.getByRole("alert")).toHaveTextContent(REGISTER_ERROR);
        });
        expect(createOnError).not.toHaveBeenCalled();
        expect(
          errorFetch.mock.calls.filter(
            ([url, init]) =>
              pathOf(url!) === "/api/v1/account/passkeys" &&
              String(init?.method ?? "GET").toUpperCase() === "POST",
          ),
        ).toHaveLength(0);
        expect(screen.queryByText(/passkey added/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/^Saved$/)).not.toBeInTheDocument();
        expect(
          screen.queryByText(NEW_PASSKEY_NICKNAME),
        ).not.toBeInTheDocument();
      } finally {
        restoreErrCreds();
      }
    } finally {
      restoreCredentials();
    }
  });
});

describe("AccountSettingsPasskeys Remove Coming soon", () => {
  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.localStorage.clear();
  });

  it("Each passkey Remove control is disabled/labeled Coming soon and does not call any DELETE", async () => {
    await renderLoadedSettings(ACCOUNT_SETTINGS_WITH_PASSKEYS);

    const accordion = passkeysAccordion();
    const removeButtons = within(accordion).getAllByRole("button", {
      name: /^Remove$/,
    });
    expect(removeButtons).toHaveLength(PASSKEYS_FIXTURE.length);

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const callsBefore = fetchMock.mock.calls.length;

    for (const btn of removeButtons) {
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute("title", "Coming soon");
      fireEvent.click(btn);
    }

    expect(passkeyDeleteCalls(fetchMock)).toHaveLength(0);
    expect(fetchMock.mock.calls.length).toBe(callsBefore);
    expect(screen.queryByText(/removed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Saved$/)).not.toBeInTheDocument();
  });
});
