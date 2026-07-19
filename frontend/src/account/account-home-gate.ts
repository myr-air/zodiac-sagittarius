import {
  loadAccountSession,
  type AccountSessionRecord,
  type StorageLike,
} from "../auth/account-session";

export type AccountHomeGateResult =
  | { kind: "redirect"; href: "/login" }
  | { kind: "home"; session: AccountSessionRecord };

export type AccountHomeShellCopy = {
  brand: string;
  title: string;
  tagline: string;
};

/**
 * Session gate for Account Home (`/trips`).
 * Redirects to login when no account session is present.
 */
export function accountHomeGate(
  storage: StorageLike | null | undefined,
): AccountHomeGateResult {
  const session = loadAccountSession(storage);
  if (!session) {
    return { kind: "redirect", href: "/login" };
  }
  return { kind: "home", session };
}

/** Static shell chrome copy for Account Home (no legacy /trips placeholder). */
export function accountHomeShellCopy(): AccountHomeShellCopy {
  return {
    brand: "Joii",
    title: "Home",
    tagline: "Plan your itinerary with us.",
  };
}
