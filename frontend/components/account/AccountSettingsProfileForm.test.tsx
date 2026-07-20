/**
 * Account settings Profile + Save — dirty enablement, PATCH, reload (draft-v2).
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 *
 * Public surface: AccountSettingsPage (identity strip + Profile / Locale forms +
 * desktop Save + mobile dock Save). ProfileForm may be composed inside the page.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
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
import { AccountSettingsProfileForm } from "./AccountSettingsProfileForm";
import type { AccountSettingsForm } from "@/src/account/account-settings-form";

/** Independent literals — initial GET /account profile (draft-v2 identity). */
const DISPLAY_NAME = "Aom";
const AVATAR_COLOR = "#0f766e";
const PRIMARY_EMAIL = "aom@joii.app";
const LOCALE = "th-TH";
const TIMEZONE = "Asia/Bangkok";
const HOME_CITY = "Bangkok";
const HOME_COUNTRY = "Thailand";
const SESSION_TOKEN = "account-session-token-profile-save";

/** Independent literals — PATCH response / reloaded settings (identity must update). */
const PATCHED_DISPLAY_NAME = "Niran";
const PATCHED_INITIALS = "NI";
const PATCHED_AVATAR = "#2563eb";

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
    locale: LOCALE,
    timezone: TIMEZONE,
    homeCity: HOME_CITY,
    homeCountry: HOME_COUNTRY,
    primaryEmail: PRIMARY_EMAIL,
  },
  passkeys: [],
  trustedDevices: [],
};

const PATCHED_SETTINGS_BODY = {
  profile: {
    id: ACCOUNT_SESSION.userId,
    displayName: PATCHED_DISPLAY_NAME,
    avatarColor: PATCHED_AVATAR,
    locale: LOCALE,
    timezone: TIMEZONE,
    homeCity: HOME_CITY,
    homeCountry: HOME_COUNTRY,
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

function saveButtons(): HTMLElement[] {
  return screen.getAllByRole("button", { name: /^Save$/ });
}

function patchCalls(
  fetchMock: ReturnType<typeof vi.fn>,
): Array<{ init: RequestInit; body: Record<string, unknown> }> {
  return fetchMock.mock.calls
    .filter(([url, init]) => pathOf(url!) === "/api/v1/account" && init?.method === "PATCH")
    .map(([, init]) => ({
      init: init as RequestInit,
      body: JSON.parse(String((init as RequestInit).body)) as Record<string, unknown>,
    }));
}

describe("Account settings Save (dirty → PATCH → reload)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveAccountSession(window.localStorage, ACCOUNT_SESSION);
    expect(window.localStorage.getItem(ACCOUNT_SESSION_STORAGE_KEY)).toBeTruthy();

    globalThis.fetch = vi.fn(async (input, init) => {
      if (pathOf(input) === "/api/v1/account") {
        if (init?.method === "PATCH") {
          return jsonResponse(PATCHED_SETTINGS_BODY);
        }
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

  it("Save (desktop + mobile dock) enabled only when dirty; click calls patchAccountSettings then reloads settings and clears dirty; identity strip updates from response", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsPage />);

    const identity = await waitFor(() =>
      screen.getByRole("region", { name: "Identity" }),
    );
    expect(within(identity).getByText(DISPLAY_NAME)).toBeInTheDocument();

    // draft-v2: desktop header Save + mobile dock Save
    const [desktopSave, mobileSave] = await waitFor(() => {
      const buttons = saveButtons();
      expect(buttons).toHaveLength(2);
      return buttons as [HTMLElement, HTMLElement];
    });

    expect(desktopSave).toBeDisabled();
    expect(mobileSave).toBeDisabled();

    const displayName = screen.getByLabelText(/display name/i);
    await user.clear(displayName);
    await user.type(displayName, PATCHED_DISPLAY_NAME);

    await waitFor(() => {
      expect(desktopSave).toBeEnabled();
      expect(mobileSave).toBeEnabled();
    });

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    expect(patchCalls(fetchMock)).toHaveLength(0);

    await user.click(desktopSave);

    // patchAccountSettings → PATCH /api/v1/account with Bearer + camelCase body
    await waitFor(() => {
      expect(patchCalls(fetchMock).length).toBeGreaterThanOrEqual(1);
    });
    const firstPatch = patchCalls(fetchMock)[0]!;
    const headers = new Headers(firstPatch.init.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(firstPatch.body).toEqual(
      expect.objectContaining({
        displayName: PATCHED_DISPLAY_NAME,
      }),
    );

    await waitFor(() => {
      expect(within(identity).getByText(PATCHED_DISPLAY_NAME)).toBeInTheDocument();
    });
    expect(within(identity).queryByText(DISPLAY_NAME)).not.toBeInTheDocument();
    expect(within(identity).getByText(PATCHED_INITIALS)).toBeInTheDocument();
    expect(within(identity).getByText(PATCHED_INITIALS)).toHaveStyle({
      backgroundColor: PATCHED_AVATAR,
    });

    await waitFor(() => {
      expect(desktopSave).toBeDisabled();
      expect(mobileSave).toBeDisabled();
    });

    // Mobile dock Save shares the same dirty → PATCH path
    await user.clear(displayName);
    await user.type(displayName, `${PATCHED_DISPLAY_NAME} X`);
    await waitFor(() => {
      expect(desktopSave).toBeEnabled();
      expect(mobileSave).toBeEnabled();
    });

    const patchesBeforeMobile = patchCalls(fetchMock).length;
    await user.click(mobileSave);
    await waitFor(() => {
      expect(patchCalls(fetchMock).length).toBeGreaterThan(patchesBeforeMobile);
    });
  });
});

/** Independent literal from PATCH error body — must surface, not a fake Saved toast. */
const PATCH_FAILURE_MESSAGE = "Could not save account settings. Please try again.";

describe("Account settings Save PATCH failure", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveAccountSession(window.localStorage, ACCOUNT_SESSION);
    expect(window.localStorage.getItem(ACCOUNT_SESSION_STORAGE_KEY)).toBeTruthy();

    globalThis.fetch = vi.fn(async (input, init) => {
      if (pathOf(input) === "/api/v1/account") {
        if (init?.method === "PATCH") {
          return jsonResponse(
            {
              error: {
                code: "internal_error",
                message: PATCH_FAILURE_MESSAGE,
              },
            },
            500,
          );
        }
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

  it("on PATCH failure, surfaces a visible error and does not show a fake Saved toast", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsPage />);

    const identity = await waitFor(() =>
      screen.getByRole("region", { name: "Identity" }),
    );
    expect(within(identity).getByText(DISPLAY_NAME)).toBeInTheDocument();

    const [desktopSave] = await waitFor(() => {
      const buttons = saveButtons();
      expect(buttons.length).toBeGreaterThanOrEqual(1);
      return buttons as [HTMLElement, ...HTMLElement[]];
    });

    const displayName = screen.getByLabelText(/display name/i);
    await user.clear(displayName);
    await user.type(displayName, PATCHED_DISPLAY_NAME);

    await waitFor(() => {
      expect(desktopSave).toBeEnabled();
    });

    await user.click(desktopSave);

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    await waitFor(() => {
      expect(patchCalls(fetchMock).length).toBeGreaterThanOrEqual(1);
    });

    const alert = await waitFor(() => screen.getByRole("alert"));
    expect(alert).toHaveTextContent(PATCH_FAILURE_MESSAGE);
    expect(screen.queryByText(/^Saved$/)).not.toBeInTheDocument();
    // Identity must not pretend the PATCH succeeded.
    expect(within(identity).getByText(DISPLAY_NAME)).toBeInTheDocument();
    expect(within(identity).queryByText(PATCHED_DISPLAY_NAME)).not.toBeInTheDocument();
  });
});

/** Independent literals — Open-Meteo geocode suggestion selection (draft-v2 hometown). */
const SUGGESTION_CITY = "Chiang Mai";
const SUGGESTION_COUNTRY = "Thailand";

function HometownTypeaheadHarness({
  fetchImpl,
}: {
  fetchImpl: typeof fetch;
}) {
  const [form, setForm] = useState<AccountSettingsForm>({
    displayName: DISPLAY_NAME,
    avatarColor: AVATAR_COLOR,
    locale: LOCALE,
    timezone: TIMEZONE,
    homeCity: "",
    homeCountry: "",
  });
  return (
    <AccountSettingsProfileForm
      form={form}
      onChange={setForm}
      fetch={fetchImpl}
      hometownDebounceMs={0}
    />
  );
}

describe("AccountSettingsProfileForm hometown typeahead", () => {
  afterEach(() => {
    cleanup();
  });

  it("selecting a city suggestion fills city + country via applyHometownSuggestion", async () => {
    const user = userEvent.setup();
    const geocodeFetch = vi.fn(async (input: RequestInfo | URL) => {
      const raw = typeof input === "string" ? input : input.toString();
      expect(raw).toContain("geocoding-api.open-meteo.com/v1/search");
      expect(raw).toContain("name=");
      return jsonResponse({
        results: [
          { name: SUGGESTION_CITY, country: SUGGESTION_COUNTRY },
          { name: "Chiang Rai", country: "Thailand" },
        ],
      });
    });

    render(<HometownTypeaheadHarness fetchImpl={geocodeFetch as typeof fetch} />);

    const city = screen.getByLabelText(/^City$/);
    const country = screen.getByLabelText(/^Country$/);
    expect(country).toHaveAttribute("readOnly");

    await user.type(city, "Chiang");

    const option = await waitFor(() =>
      screen.getByRole("option", { name: new RegExp(SUGGESTION_CITY) }),
    );
    await user.click(within(option).getByRole("button"));

    await waitFor(() => {
      expect(screen.getByLabelText(/^City$/)).toHaveValue(SUGGESTION_CITY);
      expect(screen.getByLabelText(/^Country$/)).toHaveValue(SUGGESTION_COUNTRY);
    });
    expect(geocodeFetch).toHaveBeenCalled();
  });
});
