import type { PortalSection } from "@/src/shared/portal";
import type { TripApiClient } from "@/src/trip/api-client";
import type { PlaceResolver } from "@/src/trip/place-resolution";
import type { Trip } from "@/src/trip/types";
import type { PlanningView } from "@/src/trip/workspace/planning-view";

export type SagittariusPortalSection = PortalSection;

export type SagittariusAccessMode =
  | "combined"
  | "account-login"
  | "account-register"
  | "account-portal"
  | "trip-access";

export interface SagittariusAppProps {
  initialView?: PlanningView;
  requireJoin?: boolean;
  dataSource?: "api" | "local";
  apiClient?: TripApiClient;
  placeResolver?: PlaceResolver;
  routeTripId?: string;
  initialJoinCode?: string;
  initialJoinToken?: string | null;
  accessMode?: SagittariusAccessMode;
  accountSuccessRedirectHref?: string;
  portalSection?: SagittariusPortalSection;
  initialMemberId?: string;
  initialTrip?: Trip;
}
