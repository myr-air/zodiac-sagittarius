import {
  generateJoinIdForTrip,
  generateJoinPassword,
} from "./account-trip-credentials";

export interface PortalTripWizardCredentials {
  joinId: string;
  joinPassword: string;
}

const joinPasswordPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function buildPortalTripWizardCredentials({
  currentJoinPassword,
  destinationNames,
  startDate,
  accessSalt,
}: {
  currentJoinPassword: string;
  destinationNames: string[];
  startDate: string;
  accessSalt: string;
}): PortalTripWizardCredentials {
  return {
    joinId: generateJoinIdForTrip(startDate, destinationNames, accessSalt),
    joinPassword: isValidPortalTripWizardJoinPassword(currentJoinPassword)
      ? currentJoinPassword
      : generateJoinPassword(),
  };
}

export function isValidPortalTripWizardJoinPassword(value: string): boolean {
  return joinPasswordPattern.test(value);
}
