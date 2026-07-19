import {
  type MemberSessionRecord,
  type StorageLike,
  saveMemberSession,
  tripRouteFor,
} from "../landing/create-trip";

export type { StorageLike, MemberSessionRecord };

/** Independent φ fractions: form:media = 1:φ ≈ 0.382:0.618 (draft v3). */
const PHI = (1 + Math.sqrt(5)) / 2;

const SHARED_SPLIT = {
  form: 1 / (PHI * PHI),
  media: 1 / PHI,
} as const;

const BACK_HOME = {
  href: "/",
  label: "← Back to Joii home",
} as const;

const FORM_CONTENT_WIDTH_PX = 377;

export type TripAccessShellConfig = {
  shell: "TripAccessShell";
  split: { form: number; media: number };
  brand: "Joii";
  kicker: string;
  heading: string;
  lede: string;
  media: {
    kind: "postcard-mosaic";
    columns: number[];
    rows: number[];
    ariaLabel: string;
  };
  codeRow: {
    label: string;
    inputId: string;
    submitLabel: string;
    hint: string;
    placeholder: string;
    rail: {
      contentWidthPx: number;
      controls: { inputFr: number; enterFr: number };
    };
  };
  locales: ReadonlyArray<"EN" | "TH">;
  backHome: { href: string; label: string };
  loginHref: string;
  registerHref: string;
  publicCopy: string[];
};

/** Draft-v3 Trip access shell: postcard mosaic (not AccountEntry Sign in tabs). */
export function tripAccessShell(): TripAccessShellConfig {
  return {
    shell: "TripAccessShell",
    split: { form: SHARED_SPLIT.form, media: SHARED_SPLIT.media },
    brand: "Joii",
    kicker: "Trip access",
    heading: "Already have a trip?",
    lede: "Join with an access code from your organizer — no account required to enter the room.",
    media: {
      kind: "postcard-mosaic",
      columns: [PHI, 1],
      rows: [PHI, 1, 1],
      ariaLabel: "Trip postcard mosaic",
    },
    codeRow: {
      label: "Trip access code",
      inputId: "trip-code",
      submitLabel: "Enter trip",
      hint: "Paste the code or invite link your host shared.",
      placeholder: "e.g. JOII-7K2M",
      rail: {
        contentWidthPx: FORM_CONTENT_WIDTH_PX,
        controls: { inputFr: PHI, enterFr: 1 },
      },
    },
    locales: ["EN", "TH"],
    backHome: { ...BACK_HOME },
    loginHref: "/login",
    registerHref: "/register",
    publicCopy: [
      "Joii",
      "Trip access",
      "Already have a trip?",
      "Enter trip",
      BACK_HOME.label,
    ],
  };
}

export type ClaimableMember = {
  id: string;
  tripId: string;
  displayName: string;
  role: string;
  accessStatus: string;
  color: string;
  claimedAt: string | null;
};

export type ResolveTripInviteDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type ResolveTripInviteSuccess = {
  ok: true;
  tripId: string;
  joinSessionToken: string;
  expiresAt: string;
  claimableMembers: ClaimableMember[];
};

export type ResolveTripInviteFailure = {
  ok: false;
  error: string;
};

export type ResolveTripInviteOutcome =
  | ResolveTripInviteSuccess
  | ResolveTripInviteFailure;

export type JoinAsClaimableMemberInput = {
  tripId: string;
  memberId: string;
  participantPassword: string;
  joinSessionToken: string;
  claimedAt: string | null;
};

export type JoinAsClaimableMemberDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
  storage: StorageLike;
  navigate: (route: string) => void;
};

export type JoinAsClaimableMemberSuccess = {
  ok: true;
  session: MemberSessionRecord;
  route: string;
};

export type JoinAsClaimableMemberFailure = {
  ok: false;
  error: string;
};

export type JoinAsClaimableMemberOutcome =
  | JoinAsClaimableMemberSuccess
  | JoinAsClaimableMemberFailure;

type JoinInviteBody = {
  trip?: { id?: unknown };
  claimableMembers?: unknown;
  joinSessionToken?: unknown;
  expiresAt?: unknown;
  error?: { code?: unknown; message?: unknown };
};

type MemberSessionBody = {
  tripId?: unknown;
  memberId?: unknown;
  sessionToken?: unknown;
  createdAt?: unknown;
  expiresAt?: unknown;
  error?: { code?: unknown; message?: unknown };
};

/** Default API origin from Next public env (empty = same-origin relative `/api/v1`). */
export function defaultApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL?.trim() ?? "";
}

/**
 * Extract invite token from a pasted invite URL (`?token=…`) or return a bare code.
 */
export function extractInviteToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const token = url.searchParams.get("token");
    if (token && token.trim()) return token.trim();
  } catch {
    // not a URL — treat as bare code
  }

  const queryMatch = /(?:^|[?&])token=([^&#]+)/i.exec(trimmed);
  if (queryMatch?.[1]) {
    try {
      return decodeURIComponent(queryMatch[1]).trim();
    } catch {
      return queryMatch[1].trim();
    }
  }

  return trimmed;
}

function inviteResolveUrl(apiBaseUrl: string, token: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  const params = new URLSearchParams({ token });
  return `${base}/api/v1/trip-join-invite-tokens/current?${params.toString()}`;
}

function claimUrl(apiBaseUrl: string, tripId: string, memberId: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/trips/${tripId}/members/${memberId}/claims`;
}

function memberSessionsUrl(apiBaseUrl: string, tripId: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/trips/${tripId}/member-sessions`;
}

function apiErrorMessage(
  body: { error?: { message?: unknown } } | null,
  status: number,
  fallback: string,
): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi) return fromApi;
  if (status >= 500) {
    return "Something went wrong. Please try again.";
  }
  return fallback;
}

function parseClaimableMembers(value: unknown): ClaimableMember[] {
  if (!Array.isArray(value)) return [];
  const members: ClaimableMember[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (
      typeof record.id !== "string" ||
      typeof record.tripId !== "string" ||
      typeof record.displayName !== "string" ||
      typeof record.role !== "string" ||
      typeof record.accessStatus !== "string" ||
      typeof record.color !== "string"
    ) {
      continue;
    }
    members.push({
      id: record.id,
      tripId: record.tripId,
      displayName: record.displayName,
      role: record.role,
      accessStatus: record.accessStatus,
      color: record.color,
      claimedAt:
        record.claimedAt === null || typeof record.claimedAt === "string"
          ? (record.claimedAt as string | null)
          : null,
    });
  }
  return members;
}

/**
 * Resolve an access code or invite URL via GET trip-join-invite-tokens/current.
 */
export async function resolveTripInvite(
  rawInput: string,
  deps: ResolveTripInviteDeps,
): Promise<ResolveTripInviteOutcome> {
  const token = extractInviteToken(rawInput);
  if (!token) {
    return {
      ok: false,
      error: "Enter a trip access code or paste an invite link.",
    };
  }

  let response: Response;
  try {
    response = await deps.fetch(inviteResolveUrl(deps.apiBaseUrl, token), {
      method: "GET",
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: JoinInviteBody | null = null;
  try {
    body = (await response.json()) as JoinInviteBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      error: apiErrorMessage(
        body,
        response.status,
        "Could not find that trip access code. Check it and try again.",
      ),
    };
  }

  const tripId = typeof body?.trip?.id === "string" ? body.trip.id : null;
  const joinSessionToken =
    typeof body?.joinSessionToken === "string" ? body.joinSessionToken : null;
  const expiresAt =
    typeof body?.expiresAt === "string" ? body.expiresAt : null;
  const claimableMembers = parseClaimableMembers(body?.claimableMembers);

  if (!tripId || !joinSessionToken || !expiresAt) {
    return {
      ok: false,
      error: "Invite resolved but the response was incomplete. Please try again.",
    };
  }

  return {
    ok: true,
    tripId,
    joinSessionToken,
    expiresAt,
    claimableMembers,
  };
}

/**
 * After claimable-member selection: claim (unclaimed) or login (claimed)
 * using joinSessionToken on the existing join API routes.
 */
export async function joinAsClaimableMember(
  input: JoinAsClaimableMemberInput,
  deps: JoinAsClaimableMemberDeps,
): Promise<JoinAsClaimableMemberOutcome> {
  const isClaimed = Boolean(input.claimedAt);
  const url = isClaimed
    ? memberSessionsUrl(deps.apiBaseUrl, input.tripId)
    : claimUrl(deps.apiBaseUrl, input.tripId, input.memberId);
  const body = isClaimed
    ? {
        memberId: input.memberId,
        participantPassword: input.participantPassword,
        joinSessionToken: input.joinSessionToken,
      }
    : {
        participantPassword: input.participantPassword,
        joinSessionToken: input.joinSessionToken,
      };

  let response: Response;
  try {
    response = await deps.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let sessionBody: MemberSessionBody | null = null;
  try {
    sessionBody = (await response.json()) as MemberSessionBody;
  } catch {
    sessionBody = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      error: apiErrorMessage(
        sessionBody,
        response.status,
        isClaimed
          ? "Could not sign in to that member. Check the password and try again."
          : "Could not claim that member. Check the password and try again.",
      ),
    };
  }

  if (
    !sessionBody ||
    typeof sessionBody.tripId !== "string" ||
    typeof sessionBody.memberId !== "string" ||
    typeof sessionBody.sessionToken !== "string" ||
    typeof sessionBody.createdAt !== "string" ||
    typeof sessionBody.expiresAt !== "string"
  ) {
    return {
      ok: false,
      error: "Joined but the response was incomplete. Please try again.",
    };
  }

  const session: MemberSessionRecord = {
    tripId: sessionBody.tripId,
    memberId: sessionBody.memberId,
    sessionToken: sessionBody.sessionToken,
    createdAt: sessionBody.createdAt,
    expiresAt: sessionBody.expiresAt,
  };

  saveMemberSession(deps.storage, session);
  const route = tripRouteFor(session.tripId);
  deps.navigate(route);

  return {
    ok: true,
    session,
    route,
  };
}
