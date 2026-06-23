import { ACCOUNT_PROFILE_DEFAULT_AVATAR_COLOR } from "../../model/account-profile-defaults";

export interface AccountPortalProfileDisplay {
  avatarColor: string;
  avatarInitial: string;
  displayName: string;
  email: string;
}

interface AccountPortalProfileDisplayInput {
  avatarColor?: string | null;
  displayName: string;
  email?: string | null;
  noEmail: string;
}

export function accountPortalProfileEmail(email: string | null | undefined, noEmail: string): string {
  return email ?? noEmail;
}

export function accountPortalProfileDisplayName(displayName: string | null | undefined, fallbackName: string): string {
  return displayName ?? fallbackName;
}

export function buildAccountPortalProfileDisplay({
  avatarColor,
  displayName,
  email,
  noEmail,
}: AccountPortalProfileDisplayInput): AccountPortalProfileDisplay {
  return {
    avatarColor: avatarColor ?? ACCOUNT_PROFILE_DEFAULT_AVATAR_COLOR,
    avatarInitial: displayName.slice(0, 1) || "A",
    displayName,
    email: accountPortalProfileEmail(email, noEmail),
  };
}
