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

/**
 * Independent literals — draft-v4 City searchable picker dialog (Open-Meteo
 * search moves into the dialog; Country stays derived/read-only).
 */
const SUGGESTION_CITY = "Chiang Mai";
const SUGGESTION_COUNTRY = "Thailand";
const CITY_PICKER_DIALOG_TITLE = "Choose city";
const CITY_SEARCH_LABEL = "Search cities";

function CityPickerHarness({
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

describe("AccountSettingsProfileForm city picker", () => {
  afterEach(() => {
    cleanup();
  });

  /** T6 acceptance #1 — draft-v4 City picker dialog (replaces inline combobox). */
  it("City opens searchable picker dialog; selecting sets homeCity and derived homeCountry; Country stays read-only", async () => {
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

    render(<CityPickerHarness fetchImpl={geocodeFetch as typeof fetch} />);

    const country = screen.getByLabelText(/^Country$/);
    expect(country).toHaveAttribute("readOnly");

    // draft-v4: City is a picker trigger (replaces inline Open-Meteo combobox).
    const cityTrigger = screen.getByRole("button", { name: /^City$/ });
    expect(cityTrigger).toHaveAttribute("aria-haspopup", "dialog");
    await user.click(cityTrigger);

    const dialog = await screen.findByRole("dialog", {
      name: CITY_PICKER_DIALOG_TITLE,
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const search = within(dialog).getByRole("searchbox", {
      name: CITY_SEARCH_LABEL,
    });
    await user.type(search, "Chiang");

    const option = await waitFor(() =>
      within(dialog).getByRole("option", {
        name: new RegExp(SUGGESTION_CITY),
      }),
    );
    await user.click(within(option).getByRole("button"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: CITY_PICKER_DIALOG_TITLE }))
        .not.toBeInTheDocument();
      expect(cityTrigger).toHaveTextContent(SUGGESTION_CITY);
      expect(screen.getByLabelText(/^Country$/)).toHaveValue(SUGGESTION_COUNTRY);
    });
    expect(screen.getByLabelText(/^Country$/)).toHaveAttribute("readOnly");
    expect(geocodeFetch).toHaveBeenCalled();
  });
});

/**
 * Independent literals — draft-v4 Timezone searchable picker dialog
 * (replaces plain <select>; Locale stays a select).
 */
const TIMEZONE_PICKER_DIALOG_TITLE = "Choose timezone";
const TIMEZONE_SEARCH_LABEL = "Search timezones";
const SELECTED_TIMEZONE = "Asia/Tokyo";

function TimezonePickerHarness() {
  const [form, setForm] = useState<AccountSettingsForm>({
    displayName: DISPLAY_NAME,
    avatarColor: AVATAR_COLOR,
    locale: LOCALE,
    timezone: TIMEZONE,
    homeCity: HOME_CITY,
    homeCountry: HOME_COUNTRY,
  });
  return (
    <AccountSettingsProfileForm form={form} onChange={setForm} />
  );
}

describe("AccountSettingsProfileForm timezone picker", () => {
  afterEach(() => {
    cleanup();
  });

  /** T6 acceptance #2 — draft-v4 Timezone picker dialog (replaces plain select). */
  it("Timezone opens searchable picker dialog; Locale remains a select", async () => {
    const user = userEvent.setup();
    render(<TimezonePickerHarness />);

    // Locale stays a plain <select>.
    expect(screen.getByLabelText(/^Locale$/).tagName).toBe("SELECT");

    // draft-v4: Timezone is a picker trigger (replaces plain <select>).
    const timezoneTrigger = screen.getByRole("button", { name: /^Timezone$/ });
    expect(timezoneTrigger).toHaveAttribute("aria-haspopup", "dialog");
    await user.click(timezoneTrigger);

    const dialog = await screen.findByRole("dialog", {
      name: TIMEZONE_PICKER_DIALOG_TITLE,
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const search = within(dialog).getByRole("searchbox", {
      name: TIMEZONE_SEARCH_LABEL,
    });
    await user.type(search, "Tokyo");

    const option = await waitFor(() =>
      within(dialog).getByRole("option", {
        name: new RegExp(SELECTED_TIMEZONE),
      }),
    );
    await user.click(within(option).getByRole("button"));

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: TIMEZONE_PICKER_DIALOG_TITLE }),
      ).not.toBeInTheDocument();
      expect(timezoneTrigger).toHaveTextContent(SELECTED_TIMEZONE);
    });

    // Locale must remain a plain select after the timezone picker interaction.
    expect(screen.getByLabelText(/^Locale$/).tagName).toBe("SELECT");
  });
});

/**
 * Independent literals — T6 acceptance #3 (draft-v4 picker a11y + PATCH fields).
 * Values differ from baseline so Save is dirty and body asserts are independent.
 */
const CANCEL_LABEL = "Cancel";
const PATCHED_LOCALE = "en-US";
const PATCHED_TIMEZONE = "Asia/Tokyo";
const PATCHED_HOME_CITY = "Chiang Mai";
const PATCHED_HOME_COUNTRY = "Thailand";

describe("AccountSettingsProfileForm picker a11y (draft-v4)", () => {
  afterEach(() => {
    cleanup();
  });

  /** T6 acceptance #3 — focus trap, restore, Cancel/close on City + Timezone. */
  it("City and Timezone pickers trap focus, restore on Cancel and Escape, and leave values unchanged on close", async () => {
    const user = userEvent.setup();
    render(<TimezonePickerHarness />);

    async function assertPickerA11y(args: {
      triggerName: RegExp;
      dialogTitle: string;
      searchLabel: string;
    }) {
      const trigger = screen.getByRole("button", { name: args.triggerName });
      trigger.focus();
      expect(trigger).toHaveFocus();

      await user.click(trigger);
      const dialog = await screen.findByRole("dialog", {
        name: args.dialogTitle,
      });
      expect(dialog).toHaveAttribute("aria-modal", "true");

      const search = within(dialog).getByRole("searchbox", {
        name: args.searchLabel,
      });
      const cancel = within(dialog).getByRole("button", {
        name: CANCEL_LABEL,
      });

      // Initial focus lands in the search field (draft-v4 picker open).
      await waitFor(() => {
        expect(search).toHaveFocus();
      });

      // Focus trap: Tab from last focusable (Cancel) wraps to first (search).
      cancel.focus();
      expect(cancel).toHaveFocus();
      await user.tab();
      expect(search).toHaveFocus();

      // Cancel closes and restores focus to the trigger.
      await user.click(cancel);
      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", { name: args.dialogTitle }),
        ).not.toBeInTheDocument();
      });
      expect(trigger).toHaveFocus();

      // Escape also closes and restores focus.
      await user.click(trigger);
      await screen.findByRole("dialog", { name: args.dialogTitle });
      await user.keyboard("{Escape}");
      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", { name: args.dialogTitle }),
        ).not.toBeInTheDocument();
      });
      expect(trigger).toHaveFocus();
    }

    await assertPickerA11y({
      triggerName: /^Timezone$/,
      dialogTitle: TIMEZONE_PICKER_DIALOG_TITLE,
      searchLabel: TIMEZONE_SEARCH_LABEL,
    });
    expect(screen.getByRole("button", { name: /^Timezone$/ })).toHaveTextContent(
      TIMEZONE,
    );

    await assertPickerA11y({
      triggerName: /^City$/,
      dialogTitle: CITY_PICKER_DIALOG_TITLE,
      searchLabel: CITY_SEARCH_LABEL,
    });
    expect(screen.getByRole("button", { name: /^City$/ })).toHaveTextContent(
      HOME_CITY,
    );
    expect(screen.getByLabelText(/^Country$/)).toHaveValue(HOME_COUNTRY);
  });
});

describe("Account settings Save with picker-selected locale fields", () => {
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
      const raw = typeof input === "string" ? input : input.toString();
      if (raw.includes("geocoding-api.open-meteo.com/v1/search")) {
        return jsonResponse({
          results: [
            { name: PATCHED_HOME_CITY, country: PATCHED_HOME_COUNTRY },
          ],
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    }) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.localStorage.clear();
  });

  /** T6 acceptance #3 — profile save still PATCHes locale/timezone/homeCity/homeCountry. */
  it("after Locale select + Timezone/City picker choices, Save PATCHes locale, timezone, homeCity, and homeCountry", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    const locale = screen.getByLabelText(/^Locale$/);
    await user.selectOptions(locale, PATCHED_LOCALE);

    const timezoneTrigger = screen.getByRole("button", { name: /^Timezone$/ });
    await user.click(timezoneTrigger);
    const tzDialog = await screen.findByRole("dialog", {
      name: TIMEZONE_PICKER_DIALOG_TITLE,
    });
    await user.type(
      within(tzDialog).getByRole("searchbox", { name: TIMEZONE_SEARCH_LABEL }),
      "Tokyo",
    );
    const tzOption = await waitFor(() =>
      within(tzDialog).getByRole("option", {
        name: new RegExp(PATCHED_TIMEZONE),
      }),
    );
    await user.click(within(tzOption).getByRole("button"));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: TIMEZONE_PICKER_DIALOG_TITLE }),
      ).not.toBeInTheDocument();
    });

    const cityTrigger = screen.getByRole("button", { name: /^City$/ });
    await user.click(cityTrigger);
    const cityDialog = await screen.findByRole("dialog", {
      name: CITY_PICKER_DIALOG_TITLE,
    });
    await user.type(
      within(cityDialog).getByRole("searchbox", { name: CITY_SEARCH_LABEL }),
      "Chiang",
    );
    const cityOption = await waitFor(() =>
      within(cityDialog).getByRole("option", {
        name: new RegExp(PATCHED_HOME_CITY),
      }),
    );
    await user.click(within(cityOption).getByRole("button"));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: CITY_PICKER_DIALOG_TITLE }),
      ).not.toBeInTheDocument();
      expect(cityTrigger).toHaveTextContent(PATCHED_HOME_CITY);
      expect(screen.getByLabelText(/^Country$/)).toHaveValue(
        PATCHED_HOME_COUNTRY,
      );
    });

    const [desktopSave] = await waitFor(() => {
      const buttons = saveButtons();
      expect(buttons.length).toBeGreaterThanOrEqual(1);
      return buttons as [HTMLElement, ...HTMLElement[]];
    });
    await waitFor(() => {
      expect(desktopSave).toBeEnabled();
    });

    await user.click(desktopSave);

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    await waitFor(() => {
      expect(patchCalls(fetchMock).length).toBeGreaterThanOrEqual(1);
    });
    const patch = patchCalls(fetchMock)[0]!;
    expect(patch.body).toEqual(
      expect.objectContaining({
        locale: PATCHED_LOCALE,
        timezone: PATCHED_TIMEZONE,
        homeCity: PATCHED_HOME_CITY,
        homeCountry: PATCHED_HOME_COUNTRY,
      }),
    );
  });
});
