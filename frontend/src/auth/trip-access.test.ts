import { describe, expect, it, vi } from "vitest";
import {
  MEMBER_SESSION_STORAGE_KEY,
  loadMemberSession,
  type StorageLike,
} from "../landing/create-trip";
import {
  extractInviteToken,
  resolveTripInvite,
  joinAsClaimableMember,
  tripAccessShell,
} from "./trip-access";

const TRIP_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_ID = "22222222-2222-4222-8222-222222222222";
const JOIN_SESSION_TOKEN = "join-session-token-xyz";
const INVITE_TOKEN = "invite-token-abc123";
const MEMBER_SESSION_TOKEN = "member-session-token-abc";

const JOIN_BODY = {
  trip: { id: TRIP_ID },
  claimableMembers: [
    {
      id: MEMBER_ID,
      tripId: TRIP_ID,
      displayName: "Traveler",
      role: "traveler",
      accessStatus: "active",
      color: "#0f766e",
      claimedAt: null,
    },
  ],
  joinSessionToken: JOIN_SESSION_TOKEN,
  expiresAt: "2026-07-19T01:00:00Z",
};

const MEMBER_SESSION_BODY = {
  tripId: TRIP_ID,
  memberId: MEMBER_ID,
  sessionToken: MEMBER_SESSION_TOKEN,
  createdAt: "2026-07-19T00:00:00Z",
  expiresAt: "2026-07-20T00:00:00Z",
};

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem(key: string) {
      return key in data ? data[key]! : null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Independent φ fractions: form:media = 1:φ ≈ 0.382:0.618 (draft v3). */
const PHI = (1 + Math.sqrt(5)) / 2;
const EXPECTED_FORM_SHARE = 1 / (PHI * PHI);
const EXPECTED_MEDIA_SHARE = 1 / PHI;

/** Independent draft-v3 trip mosaic column/row ratios (φ : 1). */
const EXPECTED_MOSAIC = {
  columns: [PHI, 1],
  rows: [PHI, 1, 1],
} as const;

/** Independent form-rail constants from draft v3. */
const EXPECTED_FORM_RAIL = {
  contentWidthPx: 377,
  codeRowControls: { inputFr: PHI, enterFr: 1 },
} as const;

describe("tripAccessShell", () => {
  it("configures draft-v3 postcard mosaic shell (not account-entry Sign in tabs) with code-row on the form rail", () => {
    const shell = tripAccessShell();

    expect(shell.shell).toBe("TripAccessShell");
    expect(shell.shell).not.toBe("AccountEntryShell");

    expect(shell.split.form).toBeCloseTo(EXPECTED_FORM_SHARE, 3);
    expect(shell.split.media).toBeCloseTo(EXPECTED_MEDIA_SHARE, 3);
    expect(shell.split.form + shell.split.media).toBeCloseTo(1, 5);

    expect(shell.media.kind).toBe("postcard-mosaic");
    expect(shell.media.columns).toEqual([...EXPECTED_MOSAIC.columns]);
    expect(shell.media.rows).toEqual([...EXPECTED_MOSAIC.rows]);
    expect(shell.media.ariaLabel).toMatch(/trip postcard mosaic/i);

    expect(shell.brand).toBe("Joii");
    expect(shell.kicker).toBe("Trip access");
    expect(shell.heading).toBe("Already have a trip?");
    expect(shell.lede).toMatch(/access code/i);

    expect(shell.codeRow.label).toBe("Trip access code");
    expect(shell.codeRow.inputId).toBe("trip-code");
    expect(shell.codeRow.submitLabel).toBe("Enter trip");
    expect(shell.codeRow.hint).toMatch(/invite link/i);
    expect(shell.codeRow.rail.contentWidthPx).toBe(
      EXPECTED_FORM_RAIL.contentWidthPx,
    );
    expect(shell.codeRow.rail.controls.inputFr).toBeCloseTo(
      EXPECTED_FORM_RAIL.codeRowControls.inputFr,
      3,
    );
    expect(shell.codeRow.rail.controls.enterFr).toBe(
      EXPECTED_FORM_RAIL.codeRowControls.enterFr,
    );

    expect(shell).not.toHaveProperty("tabs");
    expect(shell).not.toHaveProperty("activeTab");

    const publicCopy = shell.publicCopy.join("\n");
    expect(publicCopy).toMatch(/Joii/);
    expect(publicCopy).toMatch(/Trip access/);
    expect(publicCopy).toMatch(/Enter trip/);
    expect(publicCopy).not.toMatch(/Sign in/);
    expect(publicCopy).not.toMatch(/Sagittarius/i);
  });
});

describe("extractInviteToken", () => {
  it("returns a bare access code unchanged and extracts token from a pasted invite URL", () => {
    expect(extractInviteToken("  JOII-7K2M  ")).toBe("JOII-7K2M");
    expect(
      extractInviteToken(
        `https://joii.app/trip-access?token=${INVITE_TOKEN}`,
      ),
    ).toBe(INVITE_TOKEN);
    expect(
      extractInviteToken(
        `https://example.com/join?foo=1&token=${INVITE_TOKEN}&bar=2`,
      ),
    ).toBe(INVITE_TOKEN);
  });
});

/** Reachability copy used when fetch throws (must stay for real network failures). */
const REACHABILITY_COPY =
  "Could not reach the server. Check your connection and try again.";

/**
 * Independent expected calm copy when the guest pastes a create-flow Join ID
 * (not an invite token / URL). Implementation may live in auth-copy later.
 */
const JOIN_ID_GUIDANCE_COPY =
  "That looks like a Join ID. Paste the invite link your host shared, or use the Join ID with the trip password.";

describe("resolveTripInvite", () => {
  it("GETs trip-join-invite-tokens/current with the extracted token", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(JOIN_BODY));

    const outcome = await resolveTripInvite(
      `https://joii.app/trip-access?token=${INVITE_TOKEN}`,
      {
        fetch: fetchMock,
        apiBaseUrl: "http://127.0.0.1:5181",
      },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("expected success");
    expect(outcome.tripId).toBe(TRIP_ID);
    expect(outcome.joinSessionToken).toBe(JOIN_SESSION_TOKEN);
    expect(outcome.claimableMembers).toHaveLength(1);
    expect(outcome.claimableMembers[0]?.id).toBe(MEMBER_ID);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `http://127.0.0.1:5181/api/v1/trip-join-invite-tokens/current?token=${encodeURIComponent(INVITE_TOKEN)}`,
    );
    expect(init?.method ?? "GET").toBe("GET");
  });

  it("returns calm Join ID guidance (not reachability) for create-flow Join IDs without calling fetch", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch");
    });

    for (const joinId of ["2607-CHIA-000A", "HK-SZ-2025"] as const) {
      fetchMock.mockClear();
      const outcome = await resolveTripInvite(joinId, {
        fetch: fetchMock,
        apiBaseUrl: "http://127.0.0.1:5181",
      });

      expect(outcome.ok).toBe(false);
      if (outcome.ok) throw new Error("expected failure");
      expect(outcome.error).toBe(JOIN_ID_GUIDANCE_COPY);
      expect(outcome.error).not.toBe(REACHABILITY_COPY);
      expect(outcome.error).not.toMatch(/Could not reach the server/i);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  });

  it("keeps invite token/URL resolve path and still uses reachability copy on true network failure", async () => {
    const okFetch = vi.fn<typeof fetch>(async () => jsonResponse(JOIN_BODY));
    const okOutcome = await resolveTripInvite(INVITE_TOKEN, {
      fetch: okFetch,
      apiBaseUrl: "http://127.0.0.1:5181",
    });
    expect(okOutcome.ok).toBe(true);
    expect(okFetch).toHaveBeenCalledTimes(1);
    expect(okFetch.mock.calls[0]![0]).toBe(
      `http://127.0.0.1:5181/api/v1/trip-join-invite-tokens/current?token=${encodeURIComponent(INVITE_TOKEN)}`,
    );

    const urlFetch = vi.fn<typeof fetch>(async () => jsonResponse(JOIN_BODY));
    const urlOutcome = await resolveTripInvite(
      `https://joii.app/trip-access?token=${INVITE_TOKEN}`,
      {
        fetch: urlFetch,
        apiBaseUrl: "http://127.0.0.1:5181",
      },
    );
    expect(urlOutcome.ok).toBe(true);
    expect(urlFetch).toHaveBeenCalledTimes(1);

    const failFetch = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch");
    });
    const failOutcome = await resolveTripInvite(INVITE_TOKEN, {
      fetch: failFetch,
      apiBaseUrl: "http://127.0.0.1:5181",
    });
    expect(failOutcome).toEqual({
      ok: false,
      error: REACHABILITY_COPY,
    });
    expect(failFetch).toHaveBeenCalledTimes(1);
  });
});

describe("joinAsClaimableMember", () => {
  it("POSTs claims for unclaimed members and member-sessions for claimed members with joinSessionToken", async () => {
    const claimFetch = vi.fn<typeof fetch>(async () =>
      jsonResponse(MEMBER_SESSION_BODY),
    );

    const claimOutcome = await joinAsClaimableMember(
      {
        tripId: TRIP_ID,
        memberId: MEMBER_ID,
        participantPassword: "1234",
        joinSessionToken: JOIN_SESSION_TOKEN,
        claimedAt: null,
      },
      {
        fetch: claimFetch,
        apiBaseUrl: "http://127.0.0.1:5181",
        storage: {
          getItem: () => null,
          setItem: () => undefined,
        },
        navigate: () => undefined,
      },
    );

    expect(claimOutcome.ok).toBe(true);
    expect(claimFetch).toHaveBeenCalledTimes(1);
    const [claimUrl, claimInit] = claimFetch.mock.calls[0]!;
    expect(claimUrl).toBe(
      `http://127.0.0.1:5181/api/v1/trips/${TRIP_ID}/members/${MEMBER_ID}/claims`,
    );
    expect(claimInit?.method).toBe("POST");
    expect(claimInit?.body).toBe(
      JSON.stringify({
        participantPassword: "1234",
        joinSessionToken: JOIN_SESSION_TOKEN,
      }),
    );

    const loginFetch = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        ...MEMBER_SESSION_BODY,
        sessionToken: "member-session-token-2",
      }),
    );

    const loginOutcome = await joinAsClaimableMember(
      {
        tripId: TRIP_ID,
        memberId: MEMBER_ID,
        participantPassword: "1234",
        joinSessionToken: JOIN_SESSION_TOKEN,
        claimedAt: "2026-07-18T00:00:00Z",
      },
      {
        fetch: loginFetch,
        apiBaseUrl: "http://127.0.0.1:5181",
        storage: {
          getItem: () => null,
          setItem: () => undefined,
        },
        navigate: () => undefined,
      },
    );

    expect(loginOutcome.ok).toBe(true);
    expect(loginFetch).toHaveBeenCalledTimes(1);
    const [loginUrl, loginInit] = loginFetch.mock.calls[0]!;
    expect(loginUrl).toBe(
      `http://127.0.0.1:5181/api/v1/trips/${TRIP_ID}/member-sessions`,
    );
    expect(loginInit?.method).toBe("POST");
    expect(loginInit?.body).toBe(
      JSON.stringify({
        memberId: MEMBER_ID,
        participantPassword: "1234",
        joinSessionToken: JOIN_SESSION_TOKEN,
      }),
    );
  });
});

describe("joinAsClaimableMember session handoff", () => {
  it("stores joii.member.session and navigates to /trips/{id} on success", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(MEMBER_SESSION_BODY),
    );
    const storage = memoryStorage();
    const navigate = vi.fn();

    const outcome = await joinAsClaimableMember(
      {
        tripId: TRIP_ID,
        memberId: MEMBER_ID,
        participantPassword: "1234",
        joinSessionToken: JOIN_SESSION_TOKEN,
        claimedAt: null,
      },
      {
        fetch: fetchMock,
        apiBaseUrl: "http://127.0.0.1:5181",
        storage,
        navigate,
      },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("expected success");
    expect(outcome.route).toBe(`/trips/${TRIP_ID}`);
    expect(outcome.session.sessionToken).toBe(MEMBER_SESSION_TOKEN);

    expect(loadMemberSession(storage)?.sessionToken).toBe(MEMBER_SESSION_TOKEN);
    expect(storage.data[MEMBER_SESSION_STORAGE_KEY]).toBeTruthy();
    expect(JSON.parse(storage.data[MEMBER_SESSION_STORAGE_KEY]!)).toEqual({
      tripId: TRIP_ID,
      memberId: MEMBER_ID,
      sessionToken: MEMBER_SESSION_TOKEN,
      createdAt: "2026-07-19T00:00:00Z",
      expiresAt: "2026-07-20T00:00:00Z",
    });

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(`/trips/${TRIP_ID}`);
  });
});
