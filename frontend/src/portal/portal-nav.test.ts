import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  iconOnlyMaxWidthPx,
  portalNavCurrent,
  portalNavItems,
} from "./portal-nav";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(HERE, "../..");

/** Independent portal primary-nav contract (mission decisions — not from SUT). */
const EXPECTED_PORTAL_NAV = [
  { label: "Home", href: "/portal" },
  { label: "Explore", href: "/portal/explore" },
  { label: "Trips", href: "/portal/trips" },
  { label: "Friends", href: "/portal/friends" },
  { label: "Settings", href: "/portal/settings" },
] as const;

/** Path → current item (worked examples from mission routing decisions). */
const EXPECTED_CURRENT_BY_PATH = [
  { pathname: "/portal", currentLabel: "Home", currentHref: "/portal" },
  { pathname: "/portal/trips", currentLabel: "Trips", currentHref: "/portal/trips" },
  {
    pathname: "/portal/explore",
    currentLabel: "Explore",
    currentHref: "/portal/explore",
  },
  {
    pathname: "/portal/friends",
    currentLabel: "Friends",
    currentHref: "/portal/friends",
  },
  {
    pathname: "/portal/settings",
    currentLabel: "Settings",
    currentHref: "/portal/settings",
  },
] as const;

describe("portalNavItems", () => {
  it("lists Home, Explore, Trips, Friends, Settings in order with portal hrefs", () => {
    expect(
      portalNavItems.map((item) => ({ label: item.label, href: item.href })),
    ).toEqual([...EXPECTED_PORTAL_NAV]);
  });
});

describe("iconOnlyMaxWidthPx", () => {
  it("is 767 and nav shows label only on the active item", () => {
    expect(iconOnlyMaxWidthPx).toBe(767);

    const globals = readFileSync(join(FRONTEND_ROOT, "app/globals.css"), "utf8");
    expect(globals).toMatch(
      new RegExp(`@media\\s*\\(max-width:\\s*${iconOnlyMaxWidthPx}px\\)`),
    );
    expect(globals).toMatch(/\.nav-label\s*\{[^}]*max-width:\s*0/s);
    expect(globals).toMatch(
      /\.portal-nav-link--current\s+\.nav-label\s*\{[^}]*max-width:\s*5\.5rem/s,
    );
    expect(globals).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(globals).toMatch(/\.portal-nav-links\s*\{[^}]*justify-content:\s*center/s);
  });
});

describe("PortalNav sliding indicator", () => {
  it("uses a shared portal-nav-indicator and rejects per-link ink-fill bloom remount", () => {
    const source = readFileSync(
      join(FRONTEND_ROOT, "components/portal/PortalNav.tsx"),
      "utf8",
    );
    expect(source).toMatch(/portal-nav-indicator/);
    expect(source).not.toMatch(/portal-nav-ink-fill/);
    expect(source).not.toMatch(/key=\{pathname\}/);
    expect(source).toMatch(/portal-nav-link--current/);
  });

  it("globals.css uses sliding translate/width indicator and rejects liquid-fill bloom", () => {
    const globals = readFileSync(join(FRONTEND_ROOT, "app/globals.css"), "utf8");

    // Reject liquid ink bloom keyed animation + top-center circle clip.
    expect(globals).not.toMatch(/@keyframes\s+portal-nav-liquid-fill/);
    expect(globals).not.toMatch(
      /clip-path:\s*circle\([^)]*at\s+50%\s+0%\)/,
    );

    // Shared indicator must slide via translate/width (or translate3d + width).
    expect(globals).toMatch(
      /\.portal-nav-indicator\s*\{[^}]*(?:translate(?:3d)?|transform:\s*translate3d)[^}]*width/s,
    );
  });
});

/**
 * T4 — measured v1 slide wiring (draft-v3: linkBox → applyBox translate3d+width + RO snug).
 * Source-contract on PortalNav (+ indicator helpers it may import). Static CSS class alone
 * is not enough; measure + style application must be wired.
 */
function portalNavMeasureWiringSource(): string {
  const portalNav = readFileSync(
    join(FRONTEND_ROOT, "components/portal/PortalNav.tsx"),
    "utf8",
  );
  const indicatorHelpers = readFileSync(
    join(FRONTEND_ROOT, "src/portal/portal-nav-indicator.ts"),
    "utf8",
  );
  return `${portalNav}\n${indicatorHelpers}`;
}

describe("PortalNav measured v1 slide wiring", () => {
  it("on current-item change, sets indicator translate3d + width from measured link box", () => {
    const source = portalNavMeasureWiringSource();

    // Measure current (or target) link relative to the nav track.
    expect(source).toMatch(/getBoundingClientRect/);

    // Apply measured box via translate3d + width (draft applyBox), not CSS-only class.
    expect(source).toMatch(/translate3d\s*\(/);
    expect(source).toMatch(
      /\.style\.(?:transform|width)|style\.(?:transform|width)\s*=/,
    );
    expect(source).toMatch(/\.style\.width\s*=|style\.width\s*=/);

    // Reacts when the current item / pathname changes.
    expect(source).toMatch(/use(?:Layout)?Effect/);
  });

  it("ResizeObserver (or equivalent) re-snugs to current link when not mid-flight", () => {
    const source = portalNavMeasureWiringSource();

    expect(source).toMatch(/ResizeObserver/);
    // Skip snug while a slide/bridge is in flight (draft: if (flowing) return).
    expect(source).toMatch(/flowing|isFlowing|is-flowing|midFlight|mid-flight/);
  });

  it("asserts measured sliding-indicator mechanism (not liquid-fill-only bloom)", () => {
    const source = portalNavMeasureWiringSource();

    expect(source).toMatch(/portal-nav-indicator/);
    expect(source).toMatch(/getBoundingClientRect/);
    expect(source).toMatch(/translate3d\s*\(/);
    expect(source).toMatch(/ResizeObserver/);
    expect(source).not.toMatch(/portal-nav-ink-fill/);
    expect(source).not.toMatch(/@keyframes\s+portal-nav-liquid-fill|portal-nav-liquid-fill/);
    expect(source).not.toMatch(/key=\{pathname\}/);
  });
});

/**
 * T5 — v2 hybrid mid→settle (draft-v3 hybridMove): distance-scaled bridgeMixForGap
 * + mixedMid mid box, soft is-flowing radius, mild scaleY squash, settle ≤220ms.
 * PortalNav must wire the flight (helpers alone from T2 are not enough).
 */
function portalNavFlightSource(): string {
  return readFileSync(
    join(FRONTEND_ROOT, "components/portal/PortalNav.tsx"),
    "utf8",
  );
}

describe("PortalNav v2 hybrid mid→settle flight", () => {
  it("persists previous href across remounts for hybrid flight", () => {
    const flight = portalNavFlightSource();

    // PortalNav remounts per page (no shared layout). prev href must live at
    // module scope so soft-nav can still resolve fromLink and hybrid-fly.
    // Reject useRef-only prev href (resets to null on remount → snug-only).
    expect(flight).toMatch(
      /(?:^|\n)\s*(?:let|var)\s+\w*[Pp]rev\w*[Hh]ref\w*\s*[:=]/m,
    );
    expect(flight).toMatch(/runHybridIndicatorFlight/);
    // Module prev (not only a ref) must feed fromHref / fromLink resolution.
    expect(flight).toMatch(
      /fromHref\s*=\s*(?:\w*[Pp]rev\w*[Hh]ref\w*|[^;]*\w*[Pp]rev\w*[Hh]ref\w*)/,
    );
  });

  it("on active change runs bridgeMixForGap + mixedMid mid→settle path", () => {
    const flight = portalNavFlightSource();
    const source = portalNavMeasureWiringSource();

    // PortalNav must invoke hybrid helpers (not snap-only).
    expect(flight).toMatch(
      /bridgeMixForGap|mixedMid|runHybrid|hybridMove|hybridIndicator/,
    );
    expect(source).toMatch(/bridgeMixForGap\s*\(/);
    expect(source).toMatch(/mixedMid\s*\(/);
    // Mid then settle sequencing (rAF → mid, timeout → settle).
    expect(source).toMatch(/requestAnimationFrame/);
    expect(source).toMatch(/setTimeout/);
  });

  it("mid-flight applies is-flowing + scaleY ~0.92–0.93; settle restores scaleY 1 within ≤220ms", () => {
    const source = portalNavMeasureWiringSource();
    const globals = readFileSync(join(FRONTEND_ROOT, "app/globals.css"), "utf8");

    // Mild squash mid-flight (draft FLOW scaleY 0.93; 0.92 also accepted).
    expect(source).toMatch(/scaleY(?:\s*[:(]\s*|\s*=\s*)0\.9[23]|0\.9[23]|FLOW_SCALE_Y/);
    // Soft flowing border-radius while mid-flight.
    expect(source).toMatch(/is-flowing|isFlowing:\s*true/);
    expect(globals).toMatch(
      /\.portal-nav-indicator\.is-flowing\s*\{[^}]*border-radius:\s*44%\s+44%\s+50%\s+50%/s,
    );
    // Settle restores full height.
    expect(source).toMatch(/scaleY(?:\s*[:(]\s*|\s*=\s*)1\b|scaleY:\s*1\b/);
    // Settle / flight duration capped at ≤220ms (draft max durationMs = 200).
    expect(source).toMatch(
      /(?:durationMs|SETTLE|INK_MS|FLOW_MS|hybridDuration|SETTLE_DURATION_MAX_MS)\b[\s\S]{0,80}\b(?:1[5-9]\d|200|2[01]\d|220)\b|\b(?:1[5-9]\d|200|2[01]\d|220)\b[\s\S]{0,40}(?:ms|Ms)\b/,
    );
  });

  it("one algorithm for Home/Trips/Settings/Explore/Friends — no short-hop branch", () => {
    const flight = portalNavFlightSource();
    const source = portalNavMeasureWiringSource();

    // PortalNav wires the uniform hybrid path (not a v1-only snap).
    expect(flight).toMatch(
      /bridgeMixForGap|mixedMid|runHybrid|hybridMove|hybridIndicator/,
    );
    expect(source).toMatch(/bridgeMixForGap\s*\(/);
    expect(source).not.toMatch(/short[_-]?hop|isShortHop|SHORT_HOP/i);
  });

  it("defers modulePrevHref until settle/snug and force-settles on effect cleanup", () => {
    const flight = portalNavFlightSource();

    // Prev href committed via helper (settle / snug / cleanup) — not only eagerly.
    expect(flight).toMatch(/commitPrevHref/);
    expect(flight).toMatch(/isFlightCurrent|flightGen/);
    // Abort/snug can force-settle; RO still skips while intentionally flowing.
    expect(flight).toMatch(/snugToCurrent\s*\(\s*\{\s*force:\s*true/);
    expect(flight).toMatch(
      /if\s*\(\s*!opts\?\.force\s*&&\s*isFlowingRef\.current\s*\)\s*return/,
    );
    // Cleanup invalidates flight gen then force-settles (not timer-clear alone).
    expect(flight).toMatch(
      /flightGenRef\.current\s*\+=\s*1[\s\S]*?snugToCurrent\s*\(\s*\{\s*force:\s*true/,
    );
  });
});

/**
 * T6 — prefers-reduced-motion: reduce → snap without bridge; CSS kills transitions.
 * Settled navy + white current styles must remain (motion only is disabled).
 */
describe("PortalNav prefers-reduced-motion snap", () => {
  it("checks matchMedia reduce and passes reduceMotion so flight skips mid-bridge", () => {
    const flight = portalNavFlightSource();
    const source = portalNavMeasureWiringSource();

    expect(flight).toMatch(
      /matchMedia\s*\(\s*["']\(prefers-reduced-motion:\s*reduce\)["']\s*\)/,
    );
    expect(flight).toMatch(/reduceMotion/);
    // Helper early-return seam: reduceMotion → snap, no mid-flight bridge path.
    expect(source).toMatch(/reduceMotion/);
    expect(source).toMatch(
      /if\s*\(\s*(?:options\.)?reduceMotion\s*\)[\s\S]{0,200}return/,
    );
  });

  it("globals.css disables indicator/label transitions under prefers-reduced-motion: reduce; settled navy + white stay", () => {
    const globals = readFileSync(join(FRONTEND_ROOT, "app/globals.css"), "utf8");

    // Reduced-motion block must zero indicator + label motion (duration 0 / none).
    expect(globals).toMatch(
      /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[^}]*\.portal-nav-indicator[^}]*\}/s,
    );
    expect(globals).toMatch(
      /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[^}]*\.nav-label[^}]*\}/s,
    );
    expect(globals).toMatch(
      /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?(?:transition:\s*none|animation:\s*none|transition-duration:\s*0)/,
    );

    // Settled look remains: solid navy indicator + white current link.
    expect(globals).toMatch(
      /\.portal-nav-indicator\s*\{[^}]*(?:--portal-navy|#2a3348)[^}]*\}/s,
    );
    expect(globals).toMatch(
      /\.portal-nav-link--current\s*\{[^}]*color:\s*#fff/s,
    );
  });
});

describe("portal stub routes", () => {
  it("mounts Explore and Friends via PortalStubPage with Coming soon copy (no product surfaces)", () => {
    const stubSource = readFileSync(
      join(FRONTEND_ROOT, "components/portal/PortalStubPage.tsx"),
      "utf8",
    );
    expect(stubSource).toMatch(/Coming soon\./);
    // Stub chrome only — no live product lists / feeds / invite surfaces.
    expect(stubSource).not.toMatch(/AccountHome|TripsList|Invite|FriendList|ExploreFeed/);

    for (const segment of ["explore", "friends"] as const) {
      const source = readFileSync(
        join(FRONTEND_ROOT, `app/portal/${segment}/page.tsx`),
        "utf8",
      );
      expect(source).toMatch(/PortalStubPage/);
      const title = segment === "explore" ? "Explore" : "Friends";
      expect(source).toMatch(new RegExp(`title=["']${title}["']`));
      // Route files stay thin stubs — no alternate product page components.
      expect(source).not.toMatch(/AccountHome|PortalTripsPage|FriendsList|ExploreFeed/);
      expect(source.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//")).length).toBeLessThanOrEqual(6);
    }
  });
});

describe("portal settings route", () => {
  it("mounts AccountSettingsPage (not PortalStubPage) with PortalNav; Settings is current", () => {
    const pageSource = readFileSync(
      join(FRONTEND_ROOT, "app/portal/settings/page.tsx"),
      "utf8",
    );
    expect(pageSource).toMatch(/AccountSettingsPage/);
    expect(pageSource).not.toMatch(/PortalStubPage/);

    const settingsPageSource = readFileSync(
      join(FRONTEND_ROOT, "components/account/AccountSettingsPage.tsx"),
      "utf8",
    );
    expect(settingsPageSource).toMatch(/PortalNav/);

    const items = portalNavCurrent("/portal/settings");
    const current = items.filter((item) => item.current);
    expect(current).toHaveLength(1);
    expect(current[0]?.label).toBe("Settings");
    expect(current[0]?.href).toBe("/portal/settings");
  });
});

describe("portalNavCurrent", () => {
  it("marks exactly one item current for /portal, /portal/trips, and stub paths; brand/home is not Trips", () => {
    for (const { pathname, currentLabel, currentHref } of EXPECTED_CURRENT_BY_PATH) {
      const items = portalNavCurrent(pathname);
      const current = items.filter((item) => item.current);

      expect(current).toHaveLength(1);
      expect(current[0]?.label).toBe(currentLabel);
      expect(current[0]?.href).toBe(currentHref);
    }

    const homeItems = portalNavCurrent("/portal");
    expect(homeItems.find((item) => item.label === "Home")?.current).toBe(true);
    expect(homeItems.find((item) => item.label === "Trips")?.current).toBe(
      false,
    );
  });
});
