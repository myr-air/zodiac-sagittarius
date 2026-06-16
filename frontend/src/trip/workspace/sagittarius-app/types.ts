import type { PortalSection } from "@/src/shared/portal";

export type SagittariusPortalSection = PortalSection;

export type SagittariusAccessMode =
  | "combined"
  | "account-login"
  | "account-register"
  | "account-portal"
  | "trip-access";
