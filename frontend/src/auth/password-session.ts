import {
  type AccountSessionRecord,
  type StorageLike,
  loadAccountSession,
  saveAccountSession,
  ACCOUNT_SESSION_STORAGE_KEY,
} from "./account-session";

export type { StorageLike, AccountSessionRecord };
export { ACCOUNT_SESSION_STORAGE_KEY, loadAccountSession };

export type SignInWithPasswordInput = {
  email: string;
  password: string;
  trustDevice: boolean;
  deviceLabel: string;
};

export type SignInWithPasswordDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
  storage: StorageLike;
};

export type RegisterWithPasswordInput = SignInWithPasswordInput;

export type RegisterWithPasswordDeps = SignInWithPasswordDeps & {
  navigate: (route: string) => void;
};

export type SignInWithPasswordSuccess = {
  ok: true;
  session: AccountSessionRecord;
};

export type SignInWithPasswordFailure = {
  ok: false;
  error: string;
};

export type SignInWithPasswordOutcome =
  | SignInWithPasswordSuccess
  | SignInWithPasswordFailure;

export type RegisterWithPasswordOutcome = SignInWithPasswordOutcome;
export type PasswordSignInFields = {
  email: string;
  password: string;
};

export type PasswordRegisterFields = PasswordSignInFields & {
  confirmPassword: string;
};

export type PasswordSignInErrorPresentation = {
  visible: boolean;
  scope: "form" | "field";
  message: string;
  tokens: {
    text: "--color-danger";
    soft: "--color-danger-soft";
    border: "--color-danger-border";
  };
};

export type PasswordRegisterErrorPresentation = PasswordSignInErrorPresentation;

/** Register UI fields — email / password / confirm only (not sent beyond credentials). */
export const passwordRegisterUiFields = {
  confirmPassword: {
    id: "reg-password2",
    name: "passwordConfirm",
    label: "Confirm password",
    autocomplete: "new-password",
  },
} as const;

/** Submit is enabled only when email and password are both non-empty (trimmed). */
export function canSubmitPasswordSignIn(fields: PasswordSignInFields): boolean {
  return fields.email.trim().length > 0 && fields.password.trim().length > 0;
}

/** Register submit: email + password (≥8) + matching confirm. */
export function canSubmitPasswordRegister(
  fields: PasswordRegisterFields,
): boolean {
  return (
    fields.email.trim().length > 0 &&
    fields.password.trim().length >= 8 &&
    fields.password === fields.confirmPassword
  );
}

/** Map a failed sign-in outcome to visible inline danger error presentation. */
export function passwordSignInErrorPresentation(
  failure: SignInWithPasswordFailure,
): PasswordSignInErrorPresentation {
  return {
    visible: true,
    scope: "form",
    message: failure.error,
    tokens: {
      text: "--color-danger",
      soft: "--color-danger-soft",
      border: "--color-danger-border",
    },
  };
}

/** Map a failed register outcome to visible inline danger error presentation. */
export function passwordRegisterErrorPresentation(
  failure: SignInWithPasswordFailure,
): PasswordRegisterErrorPresentation {
  return passwordSignInErrorPresentation(failure);
}

type PasswordSessionBody = {
  userId?: unknown;
  sessionToken?: unknown;
  kind?: unknown;
  trustedDeviceId?: unknown;
  createdAt?: unknown;
  expiresAt?: unknown;
  error?: { code?: unknown; message?: unknown };
};

/** Default API origin from Next public env (empty = same-origin relative `/api/v1`). */
export function defaultApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL?.trim() ?? "";
}

function passwordSessionsUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/auth/password/sessions`;
}

function failureMessage(
  body: PasswordSessionBody | null,
  status: number,
): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi) return fromApi;
  if (status >= 500) {
    return "Something went wrong signing in. Please try again.";
  }
  return "Could not sign in. Check your email and password and try again.";
}

async function postPasswordSession(
  flow: "login" | "register",
  input: SignInWithPasswordInput,
  deps: SignInWithPasswordDeps,
): Promise<SignInWithPasswordOutcome> {
  let response: Response;
  try {
    response = await deps.fetch(passwordSessionsUrl(deps.apiBaseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        flow,
        email: input.email,
        password: input.password,
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

  let body: PasswordSessionBody | null = null;
  try {
    body = (await response.json()) as PasswordSessionBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return { ok: false, error: failureMessage(body, response.status) };
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
      error:
        flow === "register"
          ? "Account created but the response was incomplete. Please try again."
          : "Signed in but the response was incomplete. Please try again.",
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

  return { ok: true, session };
}

/**
 * POST login credentials to password sessions.
 * On success stores the account session (sessionToken) in storage.
 */
export async function signInWithPassword(
  input: SignInWithPasswordInput,
  deps: SignInWithPasswordDeps,
): Promise<SignInWithPasswordOutcome> {
  return postPasswordSession("login", input, deps);
}

/**
 * POST register credentials to password sessions.
 * On success stores the account session and navigates to `/portal`.
 */
export async function registerWithPassword(
  input: RegisterWithPasswordInput,
  deps: RegisterWithPasswordDeps,
): Promise<RegisterWithPasswordOutcome> {
  const outcome = await postPasswordSession("register", input, deps);
  if (!outcome.ok) return outcome;
  deps.navigate("/portal");
  return outcome;
}
