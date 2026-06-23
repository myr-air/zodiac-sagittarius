export const ACCOUNT_PORTAL_PROFILE_FALLBACK_AVATAR_COLOR = "#c2410c";

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

export function buildAccountPortalProfileDisplay({
  avatarColor,
  displayName,
  email,
  noEmail,
}: AccountPortalProfileDisplayInput): AccountPortalProfileDisplay {
  return {
    avatarColor: avatarColor ?? ACCOUNT_PORTAL_PROFILE_FALLBACK_AVATAR_COLOR,
    avatarInitial: displayName.slice(0, 1) || "A",
    displayName,
    email: email ?? noEmail,
  };
}
