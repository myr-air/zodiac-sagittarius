import {
  createAccountApiClient,
  type AccountApiClient,
} from "@/src/account/api-client";
import {
  createTripApiClient,
  type TripApiClient,
} from "@/src/trip/api-client";

export function publicSagittariusApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL ?? "";
}

export function createConfiguredAccountApiClient(): AccountApiClient {
  return createAccountApiClient({
    baseUrl: publicSagittariusApiBaseUrl(),
  });
}

export function createConfiguredTripApiClient(): TripApiClient {
  return createTripApiClient({
    baseUrl: publicSagittariusApiBaseUrl(),
  });
}
