/** Draft-v3 bridge mix constants (portal-nav-slide-draft-v3.html). */
export const BRIDGE_MIX_MIN = 0.22;
export const BRIDGE_MIX_MAX = 0.4;
export const GAP_FOR_MAX_MIX = 220;

/** Mid-flight mild squash (draft hybridMove scaleY). */
export const FLOW_SCALE_Y = 0.93;

/** Settle / mid duration budget — draft max is 200ms; acceptance ≤220ms. */
export const SETTLE_DURATION_MAX_MS = 220;

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export type NavBox = { x: number; width: number };

/**
 * Measure a link’s box relative to the nav track (draft `linkBox`).
 */
export function measureLinkBox(
  nav: Element,
  link: Element,
): NavBox {
  const navBox = nav.getBoundingClientRect();
  const box = link.getBoundingClientRect();
  return { x: box.left - navBox.left, width: box.width };
}

export type ApplyIndicatorBoxOptions = {
  /** When true, toggles draft `is-flowing` (mid-bridge). T4 snaps without it. */
  isFlowing?: boolean;
  scaleY?: number;
  /** When set, applies draft transition; `null` disables transition (snap). */
  durationMs?: number | null;
};

/**
 * Apply measured box via translate3d + width (draft `applyBox`).
 * Also toggles `is-ready` after first measure and optional `is-flowing`.
 */
export function applyIndicatorBox(
  indicator: HTMLElement,
  box: NavBox,
  {
    isFlowing = false,
    scaleY = 1,
    durationMs,
  }: ApplyIndicatorBoxOptions = {},
): void {
  if (durationMs === null) {
    indicator.style.transition = "none";
  } else if (typeof durationMs === "number") {
    const d = `${durationMs}ms`;
    indicator.style.transition = `transform ${d} ${EASE}, width ${d} ${EASE}, border-radius ${d} ease`;
  }
  indicator.style.transform = `translate3d(${box.x}px, 0, 0) scaleY(${scaleY})`;
  indicator.style.width = `${box.width}px`;
  indicator.classList.toggle("is-flowing", isFlowing);
  indicator.classList.add("is-ready");
}

/**
 * Interpolates bridge mix from BRIDGE_MIX_MIN → BRIDGE_MIX_MAX as gap grows
 * toward GAP_FOR_MAX_MIX (clamped).
 */
export function bridgeMixForGap(gap: number): number {
  const t = Math.min(1, Math.max(0, gap / GAP_FOR_MAX_MIX));
  return BRIDGE_MIX_MIN + (BRIDGE_MIX_MAX - BRIDGE_MIX_MIN) * t;
}

/**
 * Mid-keyframe box: lerp slideMid toward the full bridge by `mix`.
 * Same formula for every hop — distance only changes mix via bridgeMixForGap.
 */
export function mixedMid(from: NavBox, to: NavBox, mix: number): NavBox {
  const bridgeLeft = Math.min(from.x, to.x);
  const bridgeRight = Math.max(from.x + from.width, to.x + to.width);
  const bridge = { x: bridgeLeft, width: bridgeRight - bridgeLeft };
  const slideMid = {
    x: from.x + (to.x - from.x) * 0.5,
    width: from.width + (to.width - from.width) * 0.5,
  };
  return {
    x: slideMid.x + (bridge.x - slideMid.x) * mix,
    width: slideMid.width + (bridge.width - slideMid.width) * mix,
  };
}

/** Center-to-center gap between boxes (draft `centerGap`). */
export function centerGap(from: NavBox, to: NavBox): number {
  return Math.abs(from.x + from.width / 2 - (to.x + to.width / 2));
}

/**
 * Draft duration: 150 + min(50, gap * 0.15), capped at SETTLE_DURATION_MAX_MS.
 */
export function hybridDurationMs(gap: number): number {
  return Math.min(SETTLE_DURATION_MAX_MS, 150 + Math.min(50, gap * 0.15));
}

export type HybridFlightControllers = {
  setFlowing: (flowing: boolean) => void;
  clearTimer: () => void;
  /** Schedule settle callback; returns timer id for clearTimer. */
  scheduleSettle: (fn: () => void, delayMs: number) => void;
  /**
   * When false, mid rAF and settle no-op (flight generation aborted).
   * Defaults to always current when omitted.
   */
  isFlightCurrent?: () => boolean;
};

/**
 * Uniform mid→settle flight for every item pair (draft `hybridMove`).
 * Distance only scales bridge mix / duration — one path for all hops.
 */
export function runHybridIndicatorFlight(
  indicator: HTMLElement,
  from: NavBox,
  to: NavBox,
  measureSettleTarget: () => NavBox,
  controllers: HybridFlightControllers,
  options: { reduceMotion?: boolean } = {},
): void {
  const isCurrent = () =>
    controllers.isFlightCurrent ? controllers.isFlightCurrent() : true;

  // prefers-reduced-motion: reduce → instant snug; no mid-flight bridge.
  if (options.reduceMotion) {
    applyIndicatorBox(indicator, measureSettleTarget(), {
      isFlowing: false,
      scaleY: 1,
      durationMs: null,
    });
    controllers.setFlowing(false);
    return;
  }

  const gap = centerGap(from, to);
  const mix = bridgeMixForGap(gap);
  const mid = mixedMid(from, to, mix);
  const durationMs = hybridDurationMs(gap);

  controllers.setFlowing(true);
  controllers.clearTimer();

  applyIndicatorBox(indicator, from, {
    isFlowing: false,
    scaleY: 1,
    durationMs: null,
  });

  requestAnimationFrame(() => {
    if (!isCurrent()) return;

    applyIndicatorBox(indicator, mid, {
      isFlowing: true,
      scaleY: FLOW_SCALE_Y,
      durationMs,
    });

    controllers.scheduleSettle(() => {
      if (!isCurrent()) return;
      applyIndicatorBox(indicator, measureSettleTarget(), {
        isFlowing: false,
        scaleY: 1,
        durationMs,
      });
      controllers.setFlowing(false);
    }, durationMs * 0.42);
  });
}
