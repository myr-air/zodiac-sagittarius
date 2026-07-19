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

describe("createTripFromQuery", () => {
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

  it("stores the member session and navigates to /trips/{id} on success", async () => {
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

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(`/trips/${TRIP_ID}`);
    expect(navigate).not.toHaveBeenCalledWith(
      expect.stringMatching(/login|#login/i),
    );
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
