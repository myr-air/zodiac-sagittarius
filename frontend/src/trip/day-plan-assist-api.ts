/**
 * Day-plan assist — Suggest / Auto-route & fill + Accept / Reject.
 * Hits /api/v1 day-plan-assist only; Accept applies via the assist resolution
 * route (backend reuses itinerary mutations) — no parallel itinerary write path.
 */

export type DayPlanAssistApiDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type DayPlanAssistMode = "suggest" | "autoRoute";

export type DayPlanAssistMapPin = {
  itemId: string;
  lat: number;
  lng: number;
  label: string;
};

export type DayPlanAssistContext = {
  direct: unknown;
  indirect: unknown;
};

export type RequestDayPlanAssistInput = {
  tripId: string;
  sessionToken: string;
  clientMutationId: string;
  mode: DayPlanAssistMode;
  day: string;
  planVariantId: string;
  selectedItemIds: string[];
  selectedFields: string[];
  mapPins: DayPlanAssistMapPin[];
  context: DayPlanAssistContext;
};

export type DayPlanAssistOption = {
  id: string;
  label: string;
  title: string;
  summary: string;
  why: string;
  affectsItemIds: string[];
  proposedMutations: unknown[];
};

export type RequestDayPlanAssistSuccess = {
  ok: true;
  batchId: string;
  tripId: string;
  day: string;
  planVariantId: string;
  mode: DayPlanAssistMode;
  options: DayPlanAssistOption[];
};

export type RequestDayPlanAssistFailure = {
  ok: false;
  error: string;
};

export type RequestDayPlanAssistOutcome =
  | RequestDayPlanAssistSuccess
  | RequestDayPlanAssistFailure;

export type ResolveDayPlanAssistOptionInput = {
  tripId: string;
  batchId: string;
  optionId: string;
  sessionToken: string;
  clientMutationId: string;
};

export type AcceptDayPlanAssistOptionSuccess = {
  ok: true;
  batchId: string;
  tripId: string;
  optionId: string;
  status: "accepted";
  options: { id: string; status: string }[];
  appliedMutations: unknown[];
};

export type RejectDayPlanAssistOptionSuccess = {
  ok: true;
  batchId: string;
  tripId: string;
  optionId: string;
  status: "rejected";
  options: { id: string; status: string }[];
};

export type ResolveDayPlanAssistOptionFailure = {
  ok: false;
  error: string;
};

export type AcceptDayPlanAssistOptionOutcome =
  | AcceptDayPlanAssistOptionSuccess
  | ResolveDayPlanAssistOptionFailure;

export type RejectDayPlanAssistOptionOutcome =
  | RejectDayPlanAssistOptionSuccess
  | ResolveDayPlanAssistOptionFailure;

type ErrorBody = {
  error?: { code?: unknown; message?: unknown };
};

type AssistResponseBody = ErrorBody & {
  batchId?: unknown;
  tripId?: unknown;
  day?: unknown;
  planVariantId?: unknown;
  mode?: unknown;
  options?: unknown;
};

type ResolutionResponseBody = ErrorBody & {
  batchId?: unknown;
  tripId?: unknown;
  optionId?: unknown;
  status?: unknown;
  options?: unknown;
  appliedMutations?: unknown;
};

function apiBase(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/+$/, "");
}

function dayPlanAssistUrl(apiBaseUrl: string, tripId: string): string {
  return `${apiBase(apiBaseUrl)}/api/v1/trips/${encodeURIComponent(tripId)}/day-plan-assist`;
}

function dayPlanAssistOptionUrl(
  apiBaseUrl: string,
  tripId: string,
  batchId: string,
  optionId: string,
  action: "accept" | "reject",
): string {
  return `${dayPlanAssistUrl(apiBaseUrl, tripId)}/batches/${encodeURIComponent(batchId)}/options/${encodeURIComponent(optionId)}/${action}`;
}

function failureMessage(body: ErrorBody | null, fallback: string): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  return fromApi || fallback;
}

function parseOption(entry: unknown): DayPlanAssistOption | null {
  if (!entry || typeof entry !== "object") return null;
  const o = entry as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.length === 0) return null;
  if (typeof o.why !== "string" || o.why.trim().length === 0) return null;
  return {
    id: o.id,
    label: typeof o.label === "string" ? o.label : "",
    title: typeof o.title === "string" ? o.title : "",
    summary: typeof o.summary === "string" ? o.summary : "",
    why: o.why,
    affectsItemIds: Array.isArray(o.affectsItemIds)
      ? o.affectsItemIds.filter((id): id is string => typeof id === "string")
      : [],
    proposedMutations: Array.isArray(o.proposedMutations)
      ? o.proposedMutations
      : [],
  };
}

function parseAssistResponse(
  body: AssistResponseBody | null,
): RequestDayPlanAssistSuccess | null {
  if (!body) return null;
  if (typeof body.batchId !== "string") return null;
  if (typeof body.tripId !== "string") return null;
  if (typeof body.day !== "string") return null;
  if (typeof body.planVariantId !== "string") return null;
  if (body.mode !== "suggest" && body.mode !== "autoRoute") return null;
  if (!Array.isArray(body.options)) return null;

  const options: DayPlanAssistOption[] = [];
  for (const entry of body.options.slice(0, 3)) {
    const option = parseOption(entry);
    if (!option) return null;
    options.push(option);
  }
  if (options.length === 0) return null;

  return {
    ok: true,
    batchId: body.batchId,
    tripId: body.tripId,
    day: body.day,
    planVariantId: body.planVariantId,
    mode: body.mode,
    options,
  };
}

async function postJson(
  url: string,
  sessionToken: string,
  body: unknown,
  deps: DayPlanAssistApiDeps,
): Promise<{ response: Response; json: unknown | null } | { error: string }> {
  let response: Response;
  try {
    response = await deps.fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let json: unknown | null = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { response, json };
}

/**
 * POST DayPlanAssistRequest (camelCase) with Bearer member session.
 * Modes: suggest | autoRoute (Auto-route & fill).
 */
export async function requestDayPlanAssist(
  input: RequestDayPlanAssistInput,
  deps: DayPlanAssistApiDeps,
): Promise<RequestDayPlanAssistOutcome> {
  const result = await postJson(
    dayPlanAssistUrl(deps.apiBaseUrl, input.tripId),
    input.sessionToken,
    {
      clientMutationId: input.clientMutationId,
      mode: input.mode,
      day: input.day,
      planVariantId: input.planVariantId,
      selectedItemIds: input.selectedItemIds,
      selectedFields: input.selectedFields,
      mapPins: input.mapPins,
      context: input.context,
    },
    deps,
  );

  if ("error" in result) {
    return { ok: false, error: result.error };
  }

  const body =
    result.json && typeof result.json === "object"
      ? (result.json as AssistResponseBody)
      : null;

  if (!result.response.ok) {
    return {
      ok: false,
      error: failureMessage(
        body,
        "Could not get day plan suggestions. Please try again.",
      ),
    };
  }

  const parsed = parseAssistResponse(body);
  if (!parsed) {
    return {
      ok: false,
      error:
        "Suggestions returned but the response was incomplete. Please try again.",
    };
  }

  return parsed;
}

/**
 * POST Accept — applies proposedMutations via backend itinerary path only.
 * Body: { clientMutationId }.
 */
export async function acceptDayPlanAssistOption(
  input: ResolveDayPlanAssistOptionInput,
  deps: DayPlanAssistApiDeps,
): Promise<AcceptDayPlanAssistOptionOutcome> {
  const result = await postJson(
    dayPlanAssistOptionUrl(
      deps.apiBaseUrl,
      input.tripId,
      input.batchId,
      input.optionId,
      "accept",
    ),
    input.sessionToken,
    { clientMutationId: input.clientMutationId },
    deps,
  );

  if ("error" in result) {
    return { ok: false, error: result.error };
  }

  const body =
    result.json && typeof result.json === "object"
      ? (result.json as ResolutionResponseBody)
      : null;

  if (!result.response.ok) {
    return {
      ok: false,
      error: failureMessage(
        body,
        "Could not accept this suggestion. Please try again.",
      ),
    };
  }

  if (
    !body ||
    typeof body.batchId !== "string" ||
    typeof body.tripId !== "string" ||
    typeof body.optionId !== "string" ||
    body.status !== "accepted"
  ) {
    return {
      ok: false,
      error:
        "Suggestion accepted but the response was incomplete. Please try again.",
    };
  }

  return {
    ok: true,
    batchId: body.batchId,
    tripId: body.tripId,
    optionId: body.optionId,
    status: "accepted",
    options: Array.isArray(body.options)
      ? body.options
          .filter(
            (row): row is { id: string; status: string } =>
              !!row &&
              typeof row === "object" &&
              typeof (row as { id?: unknown }).id === "string" &&
              typeof (row as { status?: unknown }).status === "string",
          )
          .map((row) => ({
            id: (row as { id: string }).id,
            status: (row as { status: string }).status,
          }))
      : [],
    appliedMutations: Array.isArray(body.appliedMutations)
      ? body.appliedMutations
      : [],
  };
}

/**
 * POST Reject — does not mutate itinerary. Surfaces API error.message on failure.
 * Body: { clientMutationId }.
 */
export async function rejectDayPlanAssistOption(
  input: ResolveDayPlanAssistOptionInput,
  deps: DayPlanAssistApiDeps,
): Promise<RejectDayPlanAssistOptionOutcome> {
  const result = await postJson(
    dayPlanAssistOptionUrl(
      deps.apiBaseUrl,
      input.tripId,
      input.batchId,
      input.optionId,
      "reject",
    ),
    input.sessionToken,
    { clientMutationId: input.clientMutationId },
    deps,
  );

  if ("error" in result) {
    return { ok: false, error: result.error };
  }

  const body =
    result.json && typeof result.json === "object"
      ? (result.json as ResolutionResponseBody)
      : null;

  if (!result.response.ok) {
    return {
      ok: false,
      error: failureMessage(
        body,
        "Could not reject this suggestion. Please try again.",
      ),
    };
  }

  if (
    !body ||
    typeof body.batchId !== "string" ||
    typeof body.tripId !== "string" ||
    typeof body.optionId !== "string" ||
    body.status !== "rejected"
  ) {
    return {
      ok: false,
      error:
        "Suggestion rejected but the response was incomplete. Please try again.",
    };
  }

  return {
    ok: true,
    batchId: body.batchId,
    tripId: body.tripId,
    optionId: body.optionId,
    status: "rejected",
    options: Array.isArray(body.options)
      ? body.options
          .filter(
            (row): row is { id: string; status: string } =>
              !!row &&
              typeof row === "object" &&
              typeof (row as { id?: unknown }).id === "string" &&
              typeof (row as { status?: unknown }).status === "string",
          )
          .map((row) => ({
            id: (row as { id: string }).id,
            status: (row as { status: string }).status,
          }))
      : [],
  };
}
