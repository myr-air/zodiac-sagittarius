import { classifyTripSeed, toCreatePayload } from "../create-trip/classify-seed";

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export const MEMBER_SESSION_STORAGE_KEY = "joii.member.session";

export type MemberSessionRecord = {
  tripId: string;
  memberId: string;
  sessionToken: string;
  createdAt: string;
  expiresAt: string;
};

export type CreateTripDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
  storage: StorageLike;
  navigate: (route: string) => void;
};

export type CreateTripSuccess = {
  ok: true;
  tripId: string;
  ownerMemberId: string;
  route: string;
  trip: { joinId: string };
  joinPassword: string;
};

export type CreateTripFailure = {
  ok: false;
  error: string;
};

export type CreateTripOutcome = CreateTripSuccess | CreateTripFailure;

type PublicTripCreateBody = {
  trip?: { id?: unknown; joinId?: unknown };
  ownerMemberId?: unknown;
  joinPassword?: unknown;
  memberSession?: {
    tripId?: unknown;
    memberId?: unknown;
    sessionToken?: unknown;
    createdAt?: unknown;
    expiresAt?: unknown;
  };
  error?: { code?: unknown; message?: unknown };
};

/** Default API origin from Next public env (empty = same-origin relative `/api/v1`). */
export function defaultApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL?.trim() ?? "";
}

export function tripRouteFor(tripId: string): string {
  return `/trips/${tripId}`;
}

export function loadMemberSession(
  storage: StorageLike | null | undefined,
): MemberSessionRecord | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(MEMBER_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isMemberSessionRecord(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveMemberSession(
  storage: StorageLike | null | undefined,
  session: MemberSessionRecord,
): void {
  if (!storage) return;
  try {
    storage.setItem(MEMBER_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore quota / private mode
  }
}

function isMemberSessionRecord(value: unknown): value is MemberSessionRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.tripId === "string" &&
    typeof record.memberId === "string" &&
    typeof record.sessionToken === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.expiresAt === "string"
  );
}

function publicTripsUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/public/trips`;
}

function failureMessage(body: PublicTripCreateBody | null, status: number): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi && !/login|sign[\s-]?in|account/i.test(fromApi)) {
    return fromApi;
  }
  if (status >= 500) {
    return "Something went wrong creating your trip. Please try again.";
  }
  return "Could not create your trip. Check the destination and try again.";
}

/**
 * POST destination seed to public trip bootstrap (no account Authorization).
 * On success stores member session; caller navigates after showing credentials.
 */
export async function createTripFromQuery(
  query: string,
  deps: CreateTripDeps,
): Promise<CreateTripOutcome> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: "Enter a destination to start planning.",
    };
  }

  const classified = classifyTripSeed(trimmed);
  const payload = toCreatePayload(classified);
  const destination = payload.destinationLabel.trim() || payload.name.trim();
  if (!destination) {
    return {
      ok: false,
      error: "Enter a destination to start planning.",
    };
  }

  let response: Response;
  try {
    response = await deps.fetch(publicTripsUrl(deps.apiBaseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ destination }),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: PublicTripCreateBody | null = null;
  try {
    body = (await response.json()) as PublicTripCreateBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return { ok: false, error: failureMessage(body, response.status) };
  }

  const tripId =
    typeof body?.trip?.id === "string" ? body.trip.id : null;
  const joinId =
    typeof body?.trip?.joinId === "string" ? body.trip.joinId : "";
  const ownerMemberId =
    typeof body?.ownerMemberId === "string" ? body.ownerMemberId : null;
  const joinPassword =
    typeof body?.joinPassword === "string" ? body.joinPassword : "";
  const session = body?.memberSession;

  if (
    !tripId ||
    !ownerMemberId ||
    !session ||
    typeof session.tripId !== "string" ||
    typeof session.memberId !== "string" ||
    typeof session.sessionToken !== "string" ||
    typeof session.createdAt !== "string" ||
    typeof session.expiresAt !== "string"
  ) {
    return {
      ok: false,
      error: "Trip was created but the response was incomplete. Please try again.",
    };
  }

  const memberSession: MemberSessionRecord = {
    tripId: session.tripId,
    memberId: session.memberId,
    sessionToken: session.sessionToken,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  };

  saveMemberSession(deps.storage, memberSession);

  const route = tripRouteFor(tripId);

  return {
    ok: true,
    tripId,
    ownerMemberId,
    route,
    trip: { joinId },
    joinPassword,
  };
}
