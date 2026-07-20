import { describe, expect, it, vi } from "vitest";
import {
  createTripFromQuery,
  loadMemberSession,
  MEMBER_SESSION_STORAGE_KEY,
  tripRouteFor,
  type StorageLike,
} from "./create-trip";

const TRIP_ID = "11111111-1111-4111-8111-111111111111";
const OWNER_MEMBER_ID = "22222222-2222-4222-8222-222222222222";
const SESSION_TOKEN = "member-session-token-abc";
const JOIN_ID = "join-id-from-public-create";
const JOIN_PASSWORD = "one-shot-join-password";

const SUCCESS_BODY = {
  trip: { id: TRIP_ID },
  ownerMemberId: OWNER_MEMBER_ID,
  memberSession: {
    tripId: TRIP_ID,
    memberId: OWNER_MEMBER_ID,
    sessionToken: SESSION_TOKEN,
    createdAt: "2026-07-19T00:00:00Z",
    expiresAt: "2026-07-26T00:00:00Z",
  },
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

/** Free-text NL place seed — primary place is Chiang Mai (classify-seed draft literal). */
const FREE_TEXT_PLACE_SEED = "Chiang Mai with friends, not sure when yet";
const CLASSIFIED_PRIMARY = "Chiang Mai";
/** Already-classified primary destination (e.g. destination card / review chip). */
const PRIMARY_DESTINATION_SEED = "Vietnam";

describe("createTripFromQuery", () => {
  it("guest/signed-out landing create with a place seed (free-text or classified primary destination) POSTs /api/v1/public/trips (no Authorization) and stores member session without navigating", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(SUCCESS_BODY));
    const navigate = vi.fn();
    const storage = memoryStorage();
    const deps = {
      fetch: fetchMock,
      apiBaseUrl: "http://127.0.0.1:5181",
      storage,
      navigate,
    };

    // Classified primary destination place seed
    const fromPrimary = await createTripFromQuery(PRIMARY_DESTINATION_SEED, deps);
    expect(fromPrimary.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [primaryUrl, primaryInit] = fetchMock.mock.calls[0]!;
    expect(primaryUrl).toBe("http://127.0.0.1:5181/api/v1/public/trips");
    expect(primaryInit?.method).toBe("POST");
    expect(primaryInit?.body).toBe(
      JSON.stringify({ destination: PRIMARY_DESTINATION_SEED }),
    );
    expect(new Headers(primaryInit?.headers).get("Authorization")).toBeNull();
    expect(loadMemberSession(storage)).toEqual({
      tripId: TRIP_ID,
      memberId: OWNER_MEMBER_ID,
      sessionToken: SESSION_TOKEN,
      createdAt: "2026-07-19T00:00:00Z",
      expiresAt: "2026-07-26T00:00:00Z",
    });
    expect(navigate).not.toHaveBeenCalled();

    // Free-text NL → classified primary destination (not the raw sentence)
    fetchMock.mockClear();
    navigate.mockClear();
    const freeStorage = memoryStorage();
    const fromFreeText = await createTripFromQuery(FREE_TEXT_PLACE_SEED, {
      ...deps,
      storage: freeStorage,
    });
    expect(fromFreeText.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [freeUrl, freeInit] = fetchMock.mock.calls[0]!;
    expect(freeUrl).toBe("http://127.0.0.1:5181/api/v1/public/trips");
    expect(freeInit?.method).toBe("POST");
    expect(freeInit?.body).toBe(
      JSON.stringify({ destination: CLASSIFIED_PRIMARY }),
    );
    expect(freeInit?.body).not.toBe(
      JSON.stringify({ destination: FREE_TEXT_PLACE_SEED }),
    );
    expect(new Headers(freeInit?.headers).get("Authorization")).toBeNull();
    expect(loadMemberSession(freeStorage)).toEqual({
      tripId: TRIP_ID,
      memberId: OWNER_MEMBER_ID,
      sessionToken: SESSION_TOKEN,
      createdAt: "2026-07-19T00:00:00Z",
      expiresAt: "2026-07-26T00:00:00Z",
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("posts the query seed to public bootstrap without account login redirect", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(SUCCESS_BODY));
    const navigate = vi.fn();
    const storage = memoryStorage();

    const outcome = await createTripFromQuery("  Chiang Mai  ", {
      fetch: fetchMock,
      apiBaseUrl: "http://127.0.0.1:5181",
      storage,
      navigate,
    });

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://127.0.0.1:5181/api/v1/public/trips");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ destination: "Chiang Mai" }));

    const headers = new Headers(init?.headers);
    expect(headers.get("Content-Type")).toMatch(/application\/json/i);
    expect(headers.get("Authorization")).toBeNull();

    expect(navigate).not.toHaveBeenCalledWith(
      expect.stringMatching(/login|#login|\/account\/login/i),
    );
  });

  it("stores the member session and returns route without navigating on success", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(SUCCESS_BODY));
    const navigate = vi.fn();
    const storage = memoryStorage();

    const outcome = await createTripFromQuery("Vietnam", {
      fetch: fetchMock,
      apiBaseUrl: "http://127.0.0.1:5181",
      storage,
      navigate,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(outcome.tripId).toBe(TRIP_ID);
    expect(outcome.ownerMemberId).toBe(OWNER_MEMBER_ID);
    expect(outcome.route).toBe(tripRouteFor(TRIP_ID));
    expect(outcome.route).toBe(`/trips/${TRIP_ID}`);

    expect(loadMemberSession(storage)).toEqual({
      tripId: TRIP_ID,
      memberId: OWNER_MEMBER_ID,
      sessionToken: SESSION_TOKEN,
      createdAt: "2026-07-19T00:00:00Z",
      expiresAt: "2026-07-26T00:00:00Z",
    });
    expect(storage.data[MEMBER_SESSION_STORAGE_KEY]).toBeTruthy();

    expect(navigate).not.toHaveBeenCalled();
  });

  it("success outcome includes trip.joinId and top-level joinPassword from the create response body", async () => {
    const createBody = {
      ...SUCCESS_BODY,
      trip: { id: TRIP_ID, joinId: JOIN_ID },
      joinPassword: JOIN_PASSWORD,
    };
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(createBody));
    const navigate = vi.fn();
    const storage = memoryStorage();

    const outcome = await createTripFromQuery("Vietnam", {
      fetch: fetchMock,
      apiBaseUrl: "http://127.0.0.1:5181",
      storage,
      navigate,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(outcome.trip.joinId).toBe(JOIN_ID);
    expect(outcome.joinPassword).toBe(JOIN_PASSWORD);
  });

  it("on success saves member session but does not call navigate (caller shows credentials first)", async () => {
    const createBody = {
      ...SUCCESS_BODY,
      trip: { id: TRIP_ID, joinId: JOIN_ID },
      joinPassword: JOIN_PASSWORD,
    };
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(createBody));
    const navigate = vi.fn();
    const storage = memoryStorage();

    const outcome = await createTripFromQuery("Vietnam", {
      fetch: fetchMock,
      apiBaseUrl: "http://127.0.0.1:5181",
      storage,
      navigate,
    });

    expect(outcome.ok).toBe(true);
    expect(loadMemberSession(storage)).toEqual({
      tripId: TRIP_ID,
      memberId: OWNER_MEMBER_ID,
      sessionToken: SESSION_TOKEN,
      createdAt: "2026-07-19T00:00:00Z",
      expiresAt: "2026-07-26T00:00:00Z",
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("rejects empty destination without calling fetch or navigate", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const navigate = vi.fn();
    const storage = memoryStorage();

    const outcome = await createTripFromQuery("   ", {
      fetch: fetchMock,
      apiBaseUrl: "http://127.0.0.1:5181",
      storage,
      navigate,
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.error).toBe("Enter a destination to start planning.");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(loadMemberSession(storage)).toBeNull();
  });

  it("treats incomplete create response as failure without session or navigate", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({ trip: { id: TRIP_ID }, ownerMemberId: OWNER_MEMBER_ID }),
    );
    const navigate = vi.fn();
    const storage = memoryStorage();

    const outcome = await createTripFromQuery("Tokyo", {
      fetch: fetchMock,
      apiBaseUrl: "http://127.0.0.1:5181",
      storage,
      navigate,
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.error).toBe(
      "Trip was created but the response was incomplete. Please try again.",
    );
    expect(loadMemberSession(storage)).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("on API failure keeps a user-visible error without storing session or fake login", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(
        { error: { code: "internal_error", message: "boom" } },
        500,
      ),
    );
    const navigate = vi.fn();
    const storage = memoryStorage();

    const outcome = await createTripFromQuery("Tokyo", {
      fetch: fetchMock,
      apiBaseUrl: "http://127.0.0.1:5181",
      storage,
      navigate,
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;

    expect(outcome.error.length).toBeGreaterThan(0);
    expect(outcome.error).not.toMatch(/login|sign[\s-]?in|account/i);
    expect(loadMemberSession(storage)).toBeNull();
    expect(storage.data[MEMBER_SESSION_STORAGE_KEY]).toBeUndefined();
    expect(navigate).not.toHaveBeenCalled();
  });
});
