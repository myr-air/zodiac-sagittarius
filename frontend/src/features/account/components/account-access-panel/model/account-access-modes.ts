import type { Messages } from "@/src/i18n/messages";

export const accountAccessModeValues = [
  "combined",
  "account-login",
  "account-register",
  "account-portal",
  "trip-access",
] as const;
export type AccountAccessMode = (typeof accountAccessModeValues)[number];

export const accountPanelModeValues = ["account", "temp"] as const;
export type AccountPanelMode = (typeof accountPanelModeValues)[number];

export function mainLabel(accessMode: AccountAccessMode, labels: Messages["access"]["mainLabels"]): string {
  if (accessMode === "account-login") return labels.accountLogin;
  if (accessMode === "account-register") return labels.accountRegister;
  if (accessMode === "account-portal") return labels.accountPortal;
  if (accessMode === "trip-access") return labels.tripAccess;
  return labels.combined;
}

export function heroTitle(accessMode: AccountAccessMode, titles: Messages["access"]["titles"]): string {
  if (accessMode === "account-login") return titles.accountLogin;
  if (accessMode === "account-register") return titles.accountRegister;
  if (accessMode === "account-portal") return titles.accountPortal;
  if (accessMode === "trip-access") return titles.tripAccess;
  return titles.combined;
}

export function heroDetail(accessMode: AccountAccessMode, details: Messages["access"]["details"]): string {
  if (accessMode === "account-login") return details.accountLogin;
  if (accessMode === "account-register") return details.accountRegister;
  if (accessMode === "account-portal") return details.accountPortal;
  if (accessMode === "trip-access") return details.tripAccess;
  return details.combined;
}

export function isAccountEntryMode(accessMode: AccountAccessMode): accessMode is "account-login" | "account-register" {
  return accessMode === "account-login" || accessMode === "account-register";
}
