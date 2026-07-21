import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bridgeMixForGap,
  mixedMid,
  runHybridIndicatorFlight,
} from "./portal-nav-indicator";

/**
 * Draft-v3 constants (portal-nav-slide-draft-v3.html) — independent of SUT.
 * bridgeMixForGap: t = clamp(gap / GAP_FOR_MAX_MIX, 0, 1)
 *   → BRIDGE_MIX_MIN + (BRIDGE_MIX_MAX - BRIDGE_MIX_MIN) * t
 *
 * mixedMid (draft formula, computed in tests — not via production):
 *   bridge = { x: min(from.x,to.x), width: max(rights) - min(lefts) }
 *   slideMid = midpoint lerp of from→to at 0.5
 *   → slideMid + (bridge - slideMid) * mix
 */
const BRIDGE_MIX_MIN = 0.22;
const BRIDGE_MIX_MAX = 0.4;
const GAP_FOR_MAX_MIX = 220;

describe("bridgeMixForGap", () => {
  it("returns near BRIDGE_MIX_MIN for tiny gaps and approaches BRIDGE_MIX_MAX near GAP_FOR_MAX_MIX", () => {
    expect(bridgeMixForGap(0)).toBeCloseTo(BRIDGE_MIX_MIN, 5);
    expect(bridgeMixForGap(1)).toBeCloseTo(BRIDGE_MIX_MIN, 2);
    expect(bridgeMixForGap(GAP_FOR_MAX_MIX)).toBeCloseTo(BRIDGE_MIX_MAX, 5);
    expect(bridgeMixForGap(GAP_FOR_MAX_MIX + 80)).toBeCloseTo(BRIDGE_MIX_MAX, 5);
  });
});

describe("mixedMid", () => {
  it("interpolates slide midpoint toward full bridge by mix factor for known from/to boxes", () => {
    // from={10,40} to={100,60} mix=0.3
    // bridge={10,150}; slideMid={55,50}; expected={41.5,80}
    const from = { x: 10, width: 40 };
    const to = { x: 100, width: 60 };
    const mid = mixedMid(from, to, 0.3);
    expect(mid.x).toBeCloseTo(41.5, 5);
    expect(mid.width).toBeCloseTo(80, 5);

    // from={200,50} to={40,30} mix=0.5 (right→left)
    // bridge={40,210}; slideMid={120,40}; expected={80,125}
    const midLeft = mixedMid({ x: 200, width: 50 }, { x: 40, width: 30 }, 0.5);
    expect(midLeft.x).toBeCloseTo(80, 5);
    expect(midLeft.width).toBeCloseTo(125, 5);
  });
});

describe("uniform helpers for any item pair", () => {
  it("applies the same mixedMid/bridgeMixForGap path for small and large gaps (no short-hop branch)", () => {
    // Adjacent-scale hop (Explore↔Friends style tiny gap)
    const nearFrom = { x: 80, width: 36 };
    const nearTo = { x: 120, width: 36 };
    const nearGap = Math.abs(
      nearFrom.x + nearFrom.width / 2 - (nearTo.x + nearTo.width / 2),
    );
    // Hand: gap=40 → mix = 0.22 + 0.18*(40/220) = 0.22 + 0.032727… ≈ 0.252727
    const nearMix = bridgeMixForGap(nearGap);
    expect(nearMix).toBeCloseTo(0.252727, 4);
    // bridge={80,76}; slideMid={100,36}; mix≈0.252727
    // x = 100 + (80-100)*mix = 100 - 20*mix ≈ 94.9455
    // w = 36 + (76-36)*mix = 36 + 40*mix ≈ 46.1091
    const nearMid = mixedMid(nearFrom, nearTo, nearMix);
    expect(nearMid.x).toBeCloseTo(94.9455, 3);
    expect(nearMid.width).toBeCloseTo(46.1091, 3);

    // Distant hop (Home→Settings style large gap)
    const farFrom = { x: 8, width: 40 };
    const farTo = { x: 280, width: 48 };
    const farGap = Math.abs(
      farFrom.x + farFrom.width / 2 - (farTo.x + farTo.width / 2),
    );
    // Hand: centers 28 vs 304 → gap=276 → clamp t=1 → mix=0.4
    const farMix = bridgeMixForGap(farGap);
    expect(farMix).toBeCloseTo(BRIDGE_MIX_MAX, 5);
    // bridge={8,320}; slideMid={144,44}; mix=0.4
    // x = 144 + (8-144)*0.4 = 144 - 54.4 = 89.6
    // w = 44 + (320-44)*0.4 = 44 + 110.4 = 154.4
    const farMid = mixedMid(farFrom, farTo, farMix);
    expect(farMid.x).toBeCloseTo(89.6, 5);
    expect(farMid.width).toBeCloseTo(154.4, 5);

    // Continuous mix scaling — not a binary short/long branch
    expect(nearMix).toBeLessThan(farMix);

    // Algorithm module must not introduce a short-hop special-case branch
    const modulePath = join(dirname(fileURLToPath(import.meta.url)), "portal-nav-indicator.ts");
    const source = readFileSync(modulePath, "utf8");
    expect(source).not.toMatch(/short[_-]?hop|isShortHop|SHORT_HOP/i);
  });
});

/**
 * T5 — hybrid flight helpers must expose mid squash + settle ≤220ms (draft-v3).
 * Independent expectations from draft constants, not SUT defaults alone.
 */
describe("hybrid flight mid squash and settle budget", () => {
  it("exports mid-flight scaleY in 0.92–0.93 and settle duration ≤220ms", async () => {
    const mod = await import("./portal-nav-indicator");
    // Draft uses 0.93; allow 0.92–0.93 band from acceptance.
    const scaleY =
      "FLOW_SCALE_Y" in mod
        ? (mod as { FLOW_SCALE_Y: number }).FLOW_SCALE_Y
        : null;
    expect(scaleY).not.toBeNull();
    expect(scaleY!).toBeGreaterThanOrEqual(0.92);
    expect(scaleY!).toBeLessThanOrEqual(0.93);

    const settleMax =
      "SETTLE_DURATION_MAX_MS" in mod
        ? (mod as { SETTLE_DURATION_MAX_MS: number }).SETTLE_DURATION_MAX_MS
        : "hybridDurationMs" in mod
          ? (mod as { hybridDurationMs: (g: number) => number }).hybridDurationMs(
              10_000,
            )
          : null;
    expect(settleMax).not.toBeNull();
    expect(settleMax!).toBeLessThanOrEqual(220);
  });
});

/**
 * T6 — prefers-reduced-motion: reduce → instant snug; no mid-flight bridge.
 * Independent settle box (literal), not recomputed via mixedMid.
 */
function makeIndicatorEl() {
  const classes = new Set<string>();
  return {
    style: {
      transition: "",
      transform: "",
      width: "",
    },
    classList: {
      toggle(name: string, force?: boolean) {
        if (force === false) classes.delete(name);
        else if (force === true) classes.add(name);
        else if (classes.has(name)) classes.delete(name);
        else classes.add(name);
      },
      add(name: string) {
        classes.add(name);
      },
      contains(name: string) {
        return classes.has(name);
      },
    },
  } as unknown as HTMLElement & {
    style: { transition: string; transform: string; width: string };
    classList: { contains: (n: string) => boolean };
  };
}

describe("runHybridIndicatorFlight reduced motion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("snaps to settle box with no mid-flight bridge when reduceMotion is true", () => {
    const indicator = makeIndicatorEl();
    const from = { x: 8, width: 40 };
    const to = { x: 120, width: 56 };
    // Literal settle target — distinct from `to` so we prove measureSettleTarget wins.
    const settle = { x: 118, width: 58 };

    const raf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);

    const setFlowing = vi.fn();
    const clearTimer = vi.fn();
    const scheduleSettle = vi.fn();

    runHybridIndicatorFlight(
      indicator,
      from,
      to,
      () => settle,
      { setFlowing, clearTimer, scheduleSettle },
      { reduceMotion: true },
    );

    // Instant snug to measured settle box — no rAF mid path, no settle timer.
    expect(raf).not.toHaveBeenCalled();
    expect(scheduleSettle).not.toHaveBeenCalled();
    expect(setFlowing).toHaveBeenCalledWith(false);
    expect(indicator.style.transition).toBe("none");
    expect(indicator.style.transform).toBe(
      `translate3d(${settle.x}px, 0, 0) scaleY(1)`,
    );
    expect(indicator.style.width).toBe(`${settle.width}px`);
    expect(indicator.classList.contains("is-flowing")).toBe(false);
  });
});

/**
 * Abort generation: cleanup invalidates flight so late rAF / settle cannot
 * re-apply mid-flight after force-settle.
 */
describe("runHybridIndicatorFlight abort generation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("skips mid rAF and settle when isFlightCurrent becomes false", () => {
    const indicator = makeIndicatorEl();
    const from = { x: 8, width: 40 };
    const to = { x: 120, width: 56 };
    const settle = { x: 118, width: 58 };

    let current = true;
    const rafCbs: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCbs.push(cb);
      return 1;
    });

    const setFlowing = vi.fn();
    const clearTimer = vi.fn();
    const scheduleSettle = vi.fn();

    runHybridIndicatorFlight(
      indicator,
      from,
      to,
      () => settle,
      {
        setFlowing,
        clearTimer,
        scheduleSettle,
        isFlightCurrent: () => current,
      },
    );

    // Abort before rAF (simulates effect cleanup bumping flight gen).
    current = false;
    for (const cb of rafCbs) cb(0);

    expect(scheduleSettle).not.toHaveBeenCalled();
    expect(indicator.classList.contains("is-flowing")).toBe(false);
    // Still at the pre-rAF from snap — not mid squash.
    expect(indicator.style.transform).toBe(
      `translate3d(${from.x}px, 0, 0) scaleY(1)`,
    );
  });
});
