import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { buildPortalTripWizardCredentials } from "../portal-trip-wizard-credentials";

interface ApplyPortalTripWizardCredentialsOptions {
  accessSalt: string;
  destinationNames: string[];
  startDate: string;
}

export function applyPortalTripWizardCredentials(
  current: AccountTripCreateRequest,
  options: ApplyPortalTripWizardCredentialsOptions,
): AccountTripCreateRequest {
  const credentials = buildPortalTripWizardCredentials({
    accessSalt: options.accessSalt,
    currentJoinPassword: current.joinPassword,
    destinationNames: options.destinationNames,
    startDate: options.startDate,
  });
  if (current.joinId === credentials.joinId && current.joinPassword === credentials.joinPassword) return current;
  return { ...current, joinId: credentials.joinId, joinPassword: credentials.joinPassword };
}

export function applyRegeneratedPortalTripWizardCredentials(
  current: AccountTripCreateRequest,
  options: ApplyPortalTripWizardCredentialsOptions & { joinPassword: string },
): AccountTripCreateRequest {
  return {
    ...current,
    joinId: buildPortalTripWizardCredentials({
      accessSalt: options.accessSalt,
      currentJoinPassword: current.joinPassword,
      destinationNames: options.destinationNames,
      startDate: options.startDate,
    }).joinId,
    joinPassword: options.joinPassword,
  };
}

export function seedTripOwnerDisplayName(current: AccountTripCreateRequest, defaultOwnerDisplayName: string): AccountTripCreateRequest {
  return current.ownerDisplayName.trim() ? current : { ...current, ownerDisplayName: defaultOwnerDisplayName };
}

export function buildPortalTripWizardSubmitForm(
  tripForm: AccountTripCreateRequest,
  credentials: { joinId: string; joinPassword: string },
): AccountTripCreateRequest {
  return { ...tripForm, joinId: credentials.joinId, joinPassword: credentials.joinPassword };
}
