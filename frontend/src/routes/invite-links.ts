import { appRoutes } from "./app-routes";

function currentOrigin(): string {
  /* v8 ignore next */
  return typeof window === "undefined" ? "" : window.location.origin;
}

export function buildInviteLink(joinCode: string, token?: string | null): string {
  const path = token ? `${appRoutes.join()}?token=${encodeURIComponent(token)}` : appRoutes.join(joinCode);
  return `${currentOrigin()}${path}`;
}

export function buildInviteEmailHref(tripName: string, inviteLink: string): string {
  const subject = `Join ${tripName}`;
  const body = `Join this trip in Joii: ${inviteLink}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
