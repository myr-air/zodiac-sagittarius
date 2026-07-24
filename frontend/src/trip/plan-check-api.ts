/**
 * Plan-check inspector — client for POST /api/v1/trips/{tripId}/plan-checks,
 * GET /api/v1/trips/{tripId}/plan-checks/latest, and
 * PATCH /api/v1/trips/{tripId}/plan-suggestions/{id} (M82LQRZD T1).
 * runPlanCheck and loadLatestPlanCheck post/get with Bearer session and parse
 * PlanCheckSummary. patchPlanSuggestion is stubbed (M82LQRZD T1 #3, RED).
 */

export type PlanCheckApiDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type RunPlanCheckInput = {
  tripId: string;
  sessionToken: string;
  tripPlanId?: string;
};

export type LocalizedText = {
  en: string;
  th: string;
};

export type PlanSuggestionSummary = {
  id: string;
  tripId: string;
  planCheckId: string;
  severity: string;
  scope: string;
  targetItemIds: string[];
  explanation: LocalizedText;
  recommendedAction: LocalizedText;
  actionKind?: string | null;
  actionPayload: unknown;
  status: string;
  snoozedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type PlanCheckSummary = {
  id: string;
  tripId: string;
  tripPlanId?: string | null;
  createdBy: string;
  itineraryFingerprint: string;
  stale: boolean;
  status: string;
  languageMetadata: unknown;
  createdAt: string;
  completedAt?: string | null;
  version: number;
  suggestions: PlanSuggestionSummary[];
};

export type RunPlanCheckSuccess = {
  ok: true;
  planCheck: PlanCheckSummary;
};

export type RunPlanCheckFailure = {
  ok: false;
  error: string;
  code?: string;
};

export type RunPlanCheckOutcome = RunPlanCheckSuccess | RunPlanCheckFailure;

export type LoadLatestPlanCheckInput = {
  tripId: string;
  sessionToken: string;
  tripPlanId?: string;
};

export type LoadLatestPlanCheckSuccess = {
  ok: true;
  planCheck: PlanCheckSummary | null;
};

export type LoadLatestPlanCheckFailure = {
  ok: false;
  error: string;
  code?: string;
};

export type LoadLatestPlanCheckOutcome =
  | LoadLatestPlanCheckSuccess
  | LoadLatestPlanCheckFailure;

type ErrorBody = {
  code?: unknown;
  message?: unknown;
  error?: { code?: unknown; message?: unknown };
};

function planChecksUrl(
  apiBaseUrl: string,
  tripId: string,
  tripPlanId?: string,
): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  const url = `${base}/api/v1/trips/${encodeURIComponent(tripId)}/plan-checks`;
  return tripPlanId
    ? `${url}?tripPlanId=${encodeURIComponent(tripPlanId)}`
    : url;
}

function latestPlanCheckUrl(
  apiBaseUrl: string,
  tripId: string,
  tripPlanId?: string,
): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  const url = `${base}/api/v1/trips/${encodeURIComponent(tripId)}/plan-checks/latest`;
  return tripPlanId
    ? `${url}?tripPlanId=${encodeURIComponent(tripPlanId)}`
    : url;
}

function planSuggestionUrl(
  apiBaseUrl: string,
  tripId: string,
  suggestionId: string,
): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/trips/${encodeURIComponent(tripId)}/plan-suggestions/${encodeURIComponent(suggestionId)}`;
}

function parseSuggestion(entry: unknown): PlanSuggestionSummary | null {
  if (!entry || typeof entry !== "object") return null;
  const s = entry as Record<string, unknown>;
  if (typeof s.id !== "string" || s.id.length === 0) return null;
  return {
    id: s.id,
    tripId: typeof s.tripId === "string" ? s.tripId : "",
    planCheckId: typeof s.planCheckId === "string" ? s.planCheckId : "",
    severity: typeof s.severity === "string" ? s.severity : "",
    scope: typeof s.scope === "string" ? s.scope : "",
    targetItemIds: Array.isArray(s.targetItemIds)
      ? s.targetItemIds.filter((id): id is string => typeof id === "string")
      : [],
    explanation: (s.explanation ?? { en: "", th: "" }) as LocalizedText,
    recommendedAction: (s.recommendedAction ?? {
      en: "",
      th: "",
    }) as LocalizedText,
    actionKind: typeof s.actionKind === "string" ? s.actionKind : null,
    actionPayload: s.actionPayload ?? null,
    status: typeof s.status === "string" ? s.status : "",
    snoozedUntil: typeof s.snoozedUntil === "string" ? s.snoozedUntil : null,
    createdAt: typeof s.createdAt === "string" ? s.createdAt : "",
    updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : "",
    version: typeof s.version === "number" ? s.version : 0,
  };
}

function parsePlanCheckSummary(body: unknown): PlanCheckSummary | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.id !== "string" || b.id.length === 0) return null;
  if (typeof b.itineraryFingerprint !== "string") return null;
  if (typeof b.stale !== "boolean") return null;
  if (!Array.isArray(b.suggestions)) return null;

  const suggestions: PlanSuggestionSummary[] = [];
  for (const entry of b.suggestions) {
    const suggestion = parseSuggestion(entry);
    if (!suggestion) return null;
    suggestions.push(suggestion);
  }

  return {
    id: b.id,
    tripId: typeof b.tripId === "string" ? b.tripId : "",
    tripPlanId: typeof b.tripPlanId === "string" ? b.tripPlanId : null,
    createdBy: typeof b.createdBy === "string" ? b.createdBy : "",
    itineraryFingerprint: b.itineraryFingerprint,
    stale: b.stale,
    status: typeof b.status === "string" ? b.status : "",
    languageMetadata: b.languageMetadata ?? null,
    createdAt: typeof b.createdAt === "string" ? b.createdAt : "",
    completedAt: typeof b.completedAt === "string" ? b.completedAt : null,
    version: typeof b.version === "number" ? b.version : 0,
    suggestions,
  };
}

/**
 * POST /api/v1/trips/{tripId}/plan-checks (optional ?tripPlanId=) with
 * Bearer session; parses PlanCheckSummary.
 */
export async function runPlanCheck(
  input: RunPlanCheckInput,
  deps: PlanCheckApiDeps,
): Promise<RunPlanCheckOutcome> {
  let response: Response;
  try {
    response = await deps.fetch(
      planChecksUrl(deps.apiBaseUrl, input.tripId, input.tripPlanId),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.sessionToken}`,
          "Content-Type": "application/json",
        },
      },
    );
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: ErrorBody | null = null;
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const code =
      body && typeof body.code === "string" ? body.code : undefined;
    const fromApi =
      body && typeof body.error?.message === "string"
        ? body.error.message.trim()
        : "";
    return {
      ok: false,
      error: fromApi || "Could not run plan check. Please try again.",
      code,
    };
  }

  const planCheck = parsePlanCheckSummary(body);
  if (!planCheck) {
    return {
      ok: false,
      error:
        "Plan check ran but the response was incomplete. Please try again.",
    };
  }

  return { ok: true, planCheck };
}

/**
 * GET /api/v1/trips/{tripId}/plan-checks/latest (optional ?tripPlanId=) with
 * Bearer session; parses PlanCheckSummary, or returns planCheck: null when
 * never-checked (200 with a null body).
 */
export async function loadLatestPlanCheck(
  input: LoadLatestPlanCheckInput,
  deps: PlanCheckApiDeps,
): Promise<LoadLatestPlanCheckOutcome> {
  let response: Response;
  try {
    response = await deps.fetch(
      latestPlanCheckUrl(deps.apiBaseUrl, input.tripId, input.tripPlanId),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${input.sessionToken}`,
        },
      },
    );
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: ErrorBody | null = null;
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const code =
      body && typeof body.code === "string" ? body.code : undefined;
    const fromApi =
      body && typeof body.error?.message === "string"
        ? body.error.message.trim()
        : "";
    return {
      ok: false,
      error: fromApi || "Could not load the latest plan check. Please try again.",
      code,
    };
  }

  if (body === null) {
    return { ok: true, planCheck: null };
  }

  const planCheck = parsePlanCheckSummary(body);
  if (!planCheck) {
    return {
      ok: false,
      error:
        "Plan check response was incomplete. Please try again.",
    };
  }

  return { ok: true, planCheck };
}

export type PatchPlanSuggestionInput = {
  tripId: string;
  suggestionId: string;
  sessionToken: string;
  expectedVersion: number;
  status: string;
  /** ISO-8601 timestamp; required by the API when status is "snoozed". */
  snoozedUntil?: string;
};

export type PatchPlanSuggestionSuccess = {
  ok: true;
  suggestion: PlanSuggestionSummary;
};

export type PatchPlanSuggestionFailure = {
  ok: false;
  error: string;
  /** Present when the API returns version_conflict (T1 #3). */
  code?: string;
};

export type PatchPlanSuggestionOutcome =
  | PatchPlanSuggestionSuccess
  | PatchPlanSuggestionFailure;

/**
 * PATCH /api/v1/trips/{tripId}/plan-suggestions/{id} with Bearer session.
 * Body: { expectedVersion, status, snoozedUntil? }; parses the updated
 * PlanSuggestionSummary. On a 409/conflict response with top-level
 * `code: "version_conflict"`, returns { ok: false, code, error } without
 * throwing (M82LQRZD T1 #3).
 */
export async function patchPlanSuggestion(
  input: PatchPlanSuggestionInput,
  deps: PlanCheckApiDeps,
): Promise<PatchPlanSuggestionOutcome> {
  const body: Record<string, unknown> = {
    expectedVersion: input.expectedVersion,
    status: input.status,
  };
  if (input.snoozedUntil !== undefined) {
    body.snoozedUntil = input.snoozedUntil;
  }

  let response: Response;
  try {
    response = await deps.fetch(
      planSuggestionUrl(deps.apiBaseUrl, input.tripId, input.suggestionId),
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${input.sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let responseBody: ErrorBody | null = null;
  try {
    responseBody = (await response.json()) as ErrorBody;
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    const code =
      responseBody && typeof responseBody.code === "string"
        ? responseBody.code
        : undefined;
    const fromApi =
      responseBody && typeof responseBody.message === "string"
        ? responseBody.message.trim()
        : responseBody && typeof responseBody.error?.message === "string"
          ? responseBody.error.message.trim()
          : "";
    return {
      ok: false,
      error: fromApi || "Could not update the suggestion. Please try again.",
      code,
    };
  }

  const suggestion = parseSuggestion(responseBody);
  if (!suggestion) {
    return {
      ok: false,
      error:
        "Suggestion updated but the response was incomplete. Please try again.",
    };
  }

  return { ok: true, suggestion };
}
