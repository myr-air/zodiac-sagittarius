import { describe, expect, it } from "vitest";
import { authChrome } from "./auth-chrome";

/** Independent φ fractions — not read from the module under test. */
const PHI = (1 + Math.sqrt(5)) / 2;
const EXPECTED_FORM = 1 / (PHI * PHI);
const EXPECTED_MEDIA = 1 / PHI;

/** Independent DESIGN.md teal + danger tokens. */
const TEAL_PRIMARY = "--color-primary";
const TEAL_FOCUS_SHADOW = "0 0 0 3px rgba(15, 118, 110, 0.18)";
const DANGER = {
  text: "--color-danger",
  soft: "--color-danger-soft",
  border: "--color-danger-border",
} as const;

describe("auth chrome — labels, focus, errors, cross-links", () => {
  it("exposes visible labels, teal focus rings, danger inline errors, and Log in ↔ Register ↔ Trip access + home", () => {
    const chrome = authChrome();

    expect(chrome.labels.visible).toBe(true);
    expect(chrome.labels.signIn.email).toBe("Email");
    expect(chrome.labels.signIn.password).toBe("Password");
    expect(chrome.labels.register.email).toBe("Email");
    expect(chrome.labels.register.password).toBe("Password");
    expect(chrome.labels.register.confirmPassword).toBe("Confirm password");
    expect(chrome.labels.emailCode.code).toBe("Verification code");
    expect(chrome.labels.tripAccess.code).toBe("Trip access code");

    expect(chrome.focusRing.borderToken).toBe(TEAL_PRIMARY);
    expect(chrome.focusRing.shadow).toBe(TEAL_FOCUS_SHADOW);
    expect(chrome.focusRing.className).toMatch(/focus:border-\(--color-primary\)/);
    expect(chrome.focusRing.className).toMatch(/rgba\(15,118,110/);

    expect(chrome.inlineError.role).toBe("alert");
    expect(chrome.inlineError.tokens).toEqual(DANGER);
    expect(chrome.inlineError.className).toMatch(/--color-danger/);

    expect(chrome.crossLinks.login).toBe("/login");
    expect(chrome.crossLinks.register).toBe("/register");
    expect(chrome.crossLinks.tripAccess).toBe("/trip-access");
    expect(chrome.crossLinks.home.href).toBe("/");
    expect(chrome.crossLinks.home.label).toBe("← Back to Joii home");
  });
});

describe("auth chrome — responsive layout and motion", () => {
  it("stacks media above form at 375px-equivalent; desktop keeps φ split / trip mosaic; motion 150–220ms honors reduced-motion", () => {
    const chrome = authChrome();

    expect(chrome.layout.mobileAssertionPx).toBe(375);
    expect(chrome.layout.desktopMinPx).toBe(960);
    expect(chrome.layout.mobileStackOrder).toEqual(["media", "form"]);

    expect(chrome.layout.accountSplit.form).toBeCloseTo(EXPECTED_FORM, 3);
    expect(chrome.layout.accountSplit.media).toBeCloseTo(EXPECTED_MEDIA, 3);
    expect(
      chrome.layout.accountSplit.form + chrome.layout.accountSplit.media,
    ).toBeCloseTo(1, 5);
    expect(chrome.layout.tripMedia).toBe("postcard-mosaic");

    expect(chrome.motion.minMs).toBe(150);
    expect(chrome.motion.maxMs).toBe(220);
    expect(chrome.motion.defaultMs).toBeGreaterThanOrEqual(150);
    expect(chrome.motion.defaultMs).toBeLessThanOrEqual(220);
    expect(chrome.motion.reducedMotionQuery).toBe(
      "(prefers-reduced-motion: reduce)",
    );
    expect(chrome.motion.transitionClassName).toMatch(/180ms/);
  });
});

describe("auth chrome — post-auth destinations", () => {
  it("sends password/email/passkey success to /portal and trip access to /trips/{id}", () => {
    const chrome = authChrome();
    const tripId = "11111111-1111-4111-8111-111111111111";

    expect(chrome.destinations.accountAuthSuccess).toBe("/portal");
    expect(chrome.destinations.tripAccessSuccess(tripId)).toBe(
      `/trips/${tripId}`,
    );
  });
});
