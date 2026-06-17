import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tripParticipantSessionStorageKey } from "./auth";
import {
  clearParticipantSession,
  isLocalParticipantSession,
  loadPersistedParticipantSession,
  persistParticipantSession,
} from "./participant-session-storage";
import { tripFixture } from "./trip-fixtures";
import type { TripParticipantSession } from "./types";

const session: TripParticipantSession = {
  createdAt: "2026-06-16T00:00:00.000Z",
  expiresAt: "2026-06-17T00:00:00.000Z",
  memberId: "member-aom",
  sessionToken: "session-token",
  tripId: tripFixture.trip.id,
};

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

describe("participant session storage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-06-16T12:00:00.000Z") });
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("persists participant sessions in sessionStorage and clears legacy localStorage", () => {
    window.localStorage.setItem(tripParticipantSessionStorageKey, "legacy");

    persistParticipantSession(session);

    expect(window.sessionStorage.getItem(tripParticipantSessionStorageKey)).toBe(
      JSON.stringify(session),
    );
    expect(window.localStorage.getItem(tripParticipantSessionStorageKey)).toBeNull();
  });

  it("loads and migrates legacy localStorage sessions when they match the route trip", () => {
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify(session),
    );

    expect(
      loadPersistedParticipantSession(
        true,
        tripFixture.trip,
        false,
        tripFixture.trip.id,
      ),
    ).toEqual(session);
    expect(window.sessionStorage.getItem(tripParticipantSessionStorageKey)).toBe(
      JSON.stringify(session),
    );
    expect(window.localStorage.getItem(tripParticipantSessionStorageKey)).toBeNull();
  });

  it("rejects sessions for another route trip and removes bad storage", () => {
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({ ...session, tripId: "other-trip" }),
    );

    expect(
      loadPersistedParticipantSession(
        true,
        tripFixture.trip,
        false,
        tripFixture.trip.id,
      ),
    ).toBeNull();
    expect(window.sessionStorage.getItem(tripParticipantSessionStorageKey)).toBeNull();
  });

  it("clears both current and legacy storage and detects local sessions", () => {
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify(session),
    );
    window.localStorage.setItem(tripParticipantSessionStorageKey, "legacy");

    expect(isLocalParticipantSession(session)).toBe(false);
    expect(
      isLocalParticipantSession({ ...session, sessionToken: "local-member-aom" }),
    ).toBe(true);

    clearParticipantSession();

    expect(window.sessionStorage.getItem(tripParticipantSessionStorageKey)).toBeNull();
    expect(window.localStorage.getItem(tripParticipantSessionStorageKey)).toBeNull();
  });
});
