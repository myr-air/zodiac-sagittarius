import {
  type AccountSessionRecord,
  type StorageLike,
  loadAccountSession,
  saveAccountSession,
  ACCOUNT_SESSION_STORAGE_KEY,
} from "./account-session";

export type { StorageLike, AccountSessionRecord };
export { ACCOUNT_SESSION_STORAGE_KEY, loadAccountSession };

/** Draft v3 secondary-method control label on the password sign-in panel. */
export const SIGN_IN_CODE_ACTION_LABEL = "Use sign-in code instead";

export type SignInMethodPanel = "password" | "email-code";

/**
 * Resolve which sign-in panel is active after a method control action.
 * `"use-sign-in-code"` matches the draft "Use sign-in code instead" control.
 */
export function selectSignInMethodPanel(
  action: SignInMethodPanel | "use-sign-in-code",
): SignInMethodPanel {
  if (action === "use-sign-in-code" || action === "email-code") {
    return "email-code";
  }
  return "password";
}

export type StartEmailChallengeInput = {
  email: string;
};

export type StartEmailChallengeDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type StartEmailChallengeSuccess = {
  ok: true;
  challengeId: string;
  expiresAt: string;
};

export type StartEmailChallengeFailure = {
  ok: false;
  error: string;
};

export type StartEmailChallengeOutcome =
  | StartEmailChallengeSuccess
  | StartEmailChallengeFailure;

export type FinishEmailChallengeInput = {
  challengeId: string;
  code: string;
  trustDevice: boolean;
  deviceLabel: string;
};

export type FinishEmailChallengeDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
  storage: StorageLike;
  navigate: (route: string) => void;
};

export type FinishEmailChallengeSuccess = {
  ok: true;
  session: AccountSessionRecord;
};

export type FinishEmailChallengeFailure = {
  ok: false;
  error: string;
};

export type FinishEmailChallengeOutcome =
  | FinishEmailChallengeSuccess
  | FinishEmailChallengeFailure;

export type EmailCodeErrorPresentation = {
  visible: boolean;
  scope: "form" | "field";
  message: string;
  tokens: {
    text: "--color-danger";
    soft: "--color-danger-soft";
    border: "--color-danger-border";
  };
};

/** Map a failed email-code outcome to visible inline danger error presentation. */
export function emailCodeErrorPresentation(
  failure: FinishEmailChallengeFailure,
): EmailCodeErrorPresentation {
  return {
    visible: true,
    scope: "field",
    message: failure.error,
    tokens: {
      text: "--color-danger",
      soft: "--color-danger-soft",
      border: "--color-danger-border",
    },
  };
}

type EmailChallengeBody = {
  challengeId?: unknown;
  expiresAt?: unknown;
  error?: { code?: unknown; message?: unknown };
};

type EmailSessionBody = {
  userId?: unknown;
  sessionToken?: unknown;
  kind?: unknown;
  trustedDeviceId?: unknown;
  createdAt?: unknown;
  expiresAt?: unknown;
  error?: { code?: unknown; message?: unknown };
};

export { defaultApiBaseUrl } from "../api-base-url";

function emailChallengesUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/auth/email/challenges`;
}

function emailSessionsUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/auth/email/sessions`;
}

function challengeFailureMessage(
  body: EmailChallengeBody | null,
  status: number,
): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi) return fromApi;
  if (status >= 500) {
    return "Something went wrong sending a sign-in code. Please try again.";
  }
  return "Could not send a sign-in code. Check your email and try again.";
}

function sessionFailureMessage(
  body: EmailSessionBody | null,
  status: number,
): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi) return fromApi;
  if (status >= 500) {
    return "Something went wrong verifying the code. Please try again.";
  }
  return "That code is incorrect or expired.";
}

/**
 * POST email to start an email sign-in challenge.
 * Returns challengeId for the UI to finish with a code.
 */
export async function startEmailChallenge(
  input: StartEmailChallengeInput,
  deps: StartEmailChallengeDeps,
): Promise<StartEmailChallengeOutcome> {
  let response: Response;
  try {
    response = await deps.fetch(emailChallengesUrl(deps.apiBaseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: input.email }),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: EmailChallengeBody | null = null;
  try {
    body = (await response.json()) as EmailChallengeBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return { ok: false, error: challengeFailureMessage(body, response.status) };
  }

  if (
    !body ||
    typeof body.challengeId !== "string" ||
    typeof body.expiresAt !== "string"
  ) {
    return {
      ok: false,
      error:
        "Sign-in code started but the response was incomplete. Please try again.",
    };
  }

  return {
    ok: true,
    challengeId: body.challengeId,
    expiresAt: body.expiresAt,
  };
}

/**
 * POST challenge finish credentials to email sessions.
 * On success stores the account session and navigates to `/portal`.
 */
export async function finishEmailChallenge(
  input: FinishEmailChallengeInput,
  deps: FinishEmailChallengeDeps,
): Promise<FinishEmailChallengeOutcome> {
  let response: Response;
  try {
    response = await deps.fetch(emailSessionsUrl(deps.apiBaseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        challengeId: input.challengeId,
        code: input.code,
        trustDevice: input.trustDevice,
        deviceLabel: input.deviceLabel,
      }),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: EmailSessionBody | null = null;
  try {
    body = (await response.json()) as EmailSessionBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return { ok: false, error: sessionFailureMessage(body, response.status) };
  }

  if (
    !body ||
    typeof body.userId !== "string" ||
    typeof body.sessionToken !== "string" ||
    (body.kind !== "temporary" && body.kind !== "trusted") ||
    !(
      body.trustedDeviceId === null ||
      typeof body.trustedDeviceId === "string"
    ) ||
    typeof body.createdAt !== "string" ||
    typeof body.expiresAt !== "string"
  ) {
    return {
      ok: false,
      error: "Signed in but the response was incomplete. Please try again.",
    };
  }

  const session: AccountSessionRecord = {
    userId: body.userId,
    sessionToken: body.sessionToken,
    kind: body.kind,
    trustedDeviceId: body.trustedDeviceId,
    createdAt: body.createdAt,
    expiresAt: body.expiresAt,
  };

  saveAccountSession(deps.storage, session);
  deps.navigate("/portal");

  return { ok: true, session };
}
