import { tripRouteFor } from "../landing/create-trip";

/** Independent φ fractions: form:media = 1:φ ≈ 0.382:0.618 (draft v3). */
const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * Shared Postcard Atlas auth/access chrome — labels, focus, errors, links,
 * responsive stack, motion, and post-auth destinations (draft v3 + DESIGN.md).
 */
export const AUTH_CHROME = {
  labels: {
    visible: true,
    signIn: {
      email: "Email",
      password: "Password",
    },
    register: {
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
    },
    emailCode: {
      email: "Email",
      code: "Verification code",
    },
    tripAccess: {
      code: "Trip access code",
      member: "Who are you?",
      password: "Member password",
    },
  },
  focusRing: {
    /** Teal primary focus — DESIGN.md `--color-primary` (#0f766e). */
    borderToken: "--color-primary",
    shadow: "0 0 0 3px rgba(15, 118, 110, 0.18)",
    className:
      "focus:border-(--color-primary) focus:shadow-[0_0_0_3px_rgba(15,118,110,0.18)]",
  },
  inlineError: {
    role: "alert" as const,
    tokens: {
      text: "--color-danger",
      soft: "--color-danger-soft",
      border: "--color-danger-border",
    },
    className:
      "border-(--color-danger-border) bg-(--color-danger-soft) text-(--color-danger)",
  },
  crossLinks: {
    login: "/login",
    register: "/register",
    tripAccess: "/trip-access",
    home: {
      href: "/",
      label: "← Back to Joii home",
    },
  },
  layout: {
    /** Acceptance viewport for mobile stack assertions. */
    mobileAssertionPx: 375,
    /** Draft v3 desktop split breakpoint. */
    desktopMinPx: 960,
    /** At mobile, media stacks above the form. */
    mobileStackOrder: ["media", "form"] as const,
    accountSplit: {
      form: 1 / (PHI * PHI),
      media: 1 / PHI,
    },
    tripMedia: "postcard-mosaic" as const,
  },
  motion: {
    /** Quiet fades / tab underline (decisions.md: 150–220ms). */
    minMs: 150,
    maxMs: 220,
    defaultMs: 180,
    reducedMotionQuery: "(prefers-reduced-motion: reduce)",
    transitionClassName: "duration-[180ms]",
  },
  destinations: {
    accountAuthSuccess: "/trips",
    tripAccessSuccess: (tripId: string) => tripRouteFor(tripId),
  },
} as const;

export type AuthChrome = typeof AUTH_CHROME;

export function authChrome(): AuthChrome {
  return AUTH_CHROME;
}
