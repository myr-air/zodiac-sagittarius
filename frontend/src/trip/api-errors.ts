import { TripApiError } from "./api-client";

export function isUnauthenticated(caught: unknown): boolean {
  return caught instanceof TripApiError && caught.status === 401;
}

export function isForbidden(caught: unknown): boolean {
  return caught instanceof TripApiError && caught.status === 403;
}

export function isVersionConflict(caught: unknown): boolean {
  return caught instanceof TripApiError && caught.code === "version_conflict";
}

export function isAuthFailure(caught: unknown): boolean {
  return isUnauthenticated(caught) || isForbidden(caught);
}
