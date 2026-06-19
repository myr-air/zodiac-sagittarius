import type { ItineraryCoordinates } from "./types";
import { TripApiError } from "./api-error";

export type TripApiRequester = <T>(
  path: string,
  init: RequestInit,
) => Promise<T>;

export function createTripApiRequester({
  baseUrl = "",
  fetcher = fetch,
}: {
  baseUrl?: string;
  fetcher?: typeof fetch;
}): TripApiRequester {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl);

  return async function request<T>(
    path: string,
    init: RequestInit,
  ): Promise<T> {
    const response = await fetcher(`${normalizedBaseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw await toTripApiError(response);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  };
}

export function serializeItineraryLocation<
  T extends { coordinates?: ItineraryCoordinates | null; address?: string | null },
>(request: T) {
  const { coordinates, ...rest } = request;
  return {
    ...rest,
    ...(request.address !== undefined ? { address: request.address } : {}),
    ...(coordinates !== undefined
      ? {
          latitude: coordinates?.lat ?? null,
          longitude: coordinates?.lng ?? null,
        }
      : {}),
  };
}

async function toTripApiError(response: Response): Promise<TripApiError> {
  const fallback = {
    code: "request_failed",
    message: `request failed with ${response.status}`,
  };
  const body = (await response.json().catch(() => fallback)) as Partial<
    typeof fallback
  >;
  return new TripApiError({
    code: body.code ?? fallback.code,
    message: body.message ?? fallback.message,
    status: response.status,
  });
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
