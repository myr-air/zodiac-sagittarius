/**
 * loadAccountSettings — GET /account → identity strip view-model (draft-v2).
 */
import { describe, expect, it, vi } from "vitest";
import { loadAccountSettings } from "./account-settings-load";

const SESSION_TOKEN = "account-session-token-xyz";
const API_BASE = "http://127.0.0.1:5181";

/** Independent literals from draft-v2 identity strip + AccountSettings body. */
const DISPLAY_NAME = "Aom";
const INITIALS = "AO";
const AVATAR_COLOR = "#0f766e";
const PRIMARY_EMAIL = "aom@joii.app";

const ACCOUNT_SETTINGS_BODY = {
  profile: {
    id: "018f4e80-0000-7000-a000-000000000001",
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function pathOf(url: RequestInfo | URL): string {
  const raw = typeof url === "string" ? url : url.toString();
  return new URL(raw, API_BASE).pathname;
}

describe("loadAccountSettings", () => {
  it("on session present, fetches GET /account and returns identity strip fields (initials, avatarColor, displayName, primaryEmail)", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const path = pathOf(input);
      if (path === "/api/v1/account") {
        return jsonResponse(ACCOUNT_SETTINGS_BODY);
      }
      return jsonResponse({ error: { message: "unexpected endpoint" } }, 404);
    });

    const outcome = await loadAccountSettings(
      { sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(fetchMock).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(pathOf(url!)).toBe("/api/v1/account");
    expect(init?.method ?? "GET").toBe("GET");
    expect(init?.headers).toMatchObject({
      Authorization: `Bearer ${SESSION_TOKEN}`,
    });

    expect(outcome).toEqual({
      ok: true,
      identity: {
        displayName: DISPLAY_NAME,
        primaryEmail: PRIMARY_EMAIL,
        avatarColor: AVATAR_COLOR,
        initials: INITIALS,
      },
    });
  });
});
