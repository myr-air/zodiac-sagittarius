import { accountSessionStorageKey } from "@/src/account/session-storage";
export {
  installLocalStorageStub,
  installSessionStorageStub,
} from "@/src/testing/browser-storage";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { tripStorageKey } from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import type { Trip } from "@/src/trip/types";

export function persistTrustedAccountSession(
  storage: Pick<Storage, "setItem">,
  sessionToken = "playwright-account-session",
) {
  persistAccountSession(storage, { sessionToken });
}

export function persistAccountSession(
  storage: Pick<Storage, "setItem">,
  {
    createdAt = "2026-05-30T10:00:00.000Z",
    expiresAt = "2030-01-01T10:00:00.000Z",
    kind = "trusted",
    sessionToken = "playwright-account-session",
    trustedDeviceId = kind === "trusted" ? "device-1" : undefined,
    userId = "11111111-1111-1111-1111-111111111111",
  }: {
    createdAt?: string;
    expiresAt?: string;
    kind?: "temporary" | "trusted";
    sessionToken?: string;
    trustedDeviceId?: string;
    userId?: string;
  } = {},
) {
  storage.setItem(
    accountSessionStorageKey,
    JSON.stringify({
      userId,
      sessionToken,
      kind,
      ...(trustedDeviceId ? { trustedDeviceId } : {}),
      createdAt,
      expiresAt,
    }),
  );
}

export function persistTripParticipantSession(
  storage: Pick<Storage, "setItem">,
  {
    createdAt = "2026-05-29T00:00:00.000Z",
    expiresAt = "2026-06-28T00:00:00.000Z",
    memberId = seedTrip.members[0].id,
    sessionToken = "persisted-trip-session",
    tripId = seedTrip.id,
  }: {
    createdAt?: string;
    expiresAt?: string;
    memberId?: string;
    sessionToken?: string;
    tripId?: string;
  } = {},
) {
  storage.setItem(
    tripParticipantSessionStorageKey,
    JSON.stringify({
      tripId,
      memberId,
      sessionToken,
      createdAt,
      expiresAt,
    }),
  );
}

export function persistTripDraft(
  storage: Pick<Storage, "setItem">,
  trip: Trip,
) {
  storage.setItem(tripStorageKey, JSON.stringify(trip));
}

export function loadPersistedTripDraft(
  storage: Pick<Storage, "getItem">,
): Trip {
  return JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
}
