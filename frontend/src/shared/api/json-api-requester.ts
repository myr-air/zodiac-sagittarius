export interface JsonApiErrorInput {
  code: string;
  message: string;
  status: number;
}

export type JsonApiRequester = <T>(
  path: string,
  init: RequestInit,
) => Promise<T>;

export function createJsonApiRequester({
  baseUrl = "",
  fetcher = fetch,
  credentials,
  createError,
}: {
  baseUrl?: string;
  credentials?: RequestCredentials;
  fetcher?: typeof fetch;
  createError: (input: JsonApiErrorInput) => Error;
}): JsonApiRequester {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl);

  return async function request<T>(
    path: string,
    init: RequestInit,
  ): Promise<T> {
    const response = await fetcher(`${normalizedBaseUrl}${path}`, {
      ...init,
      credentials: init.credentials ?? credentials,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw await toJsonApiError(response, createError);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  };
}

async function toJsonApiError(
  response: Response,
  createError: (input: JsonApiErrorInput) => Error,
): Promise<Error> {
  const fallback = {
    code: "request_failed",
    message: `request failed with ${response.status}`,
  };
  const body = (await response.json().catch(() => fallback)) as Partial<
    typeof fallback
  >;
  return createError({
    code: body.code ?? fallback.code,
    message: body.message ?? fallback.message,
    status: response.status,
  });
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
