import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installBrowserStorage } from "@/src/testing/browser-storage";
import { tripParticipantSessionStorageKey } from "../../auth";
import {
  clearParticipantSession,
  isLocalParticipantSession,
  loadPersistedParticipantSession,
  persistParticipantSession,
} from "../../auth";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { TripParticipantSession } from "../../types";

const session: TripParticipantSession = {
  createdAt: "2026-06-16T00:00:00.000Z",
  expiresAt: "2026-06-21T00:00:00.000Z",
  memberId: "member-aom",
  sessionToken: "session-token",
  tripId: tripFixture.trip.id,
};

describe("participant session storage", () => {
  let restoreStorage: () => void;

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-06-16T12:00:00.000Z") });
    restoreStorage = installBrowserStorage();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    restoreStorage();
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
