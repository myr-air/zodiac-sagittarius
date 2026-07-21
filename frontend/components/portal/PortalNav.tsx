"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { portalNavCurrent } from "@/src/portal/portal-nav";
import {
  applyIndicatorBox,
  measureLinkBox,
  runHybridIndicatorFlight,
} from "@/src/portal/portal-nav-indicator";

const NAV_ICONS: Record<string, ReactNode> = {
  Home: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
    </svg>
  ),
  Explore: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  Trips: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  ),
  Friends: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a3 3 0 0 1 0 5.74" />
    </svg>
  ),
  Settings: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M4 12h2m12 0h2M12 4v2m0 12v2" />
    </svg>
  ),
};

/**
 * Survives PortalNav remounts (nav is per-page, not a shared layout) so soft-nav
 * can still resolve fromLink and run hybrid flight instead of snug-only.
 */
let modulePrevHref: string | null = null;

/** Sliding navy indicator under links (draft-v3 hybrid slide). */
export function PortalNav() {
  const pathname = usePathname() ?? "/portal";
  const items = portalNavCurrent(pathname);
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const prevHrefRef = useRef<string | null>(modulePrevHref);
  const isFlowingRef = useRef(false);
  const flowTimerRef = useRef<ReturnType<typeof setTimeout> | 0>(0);
  const flightGenRef = useRef(0);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;

    const currentItem = portalNavCurrent(pathname).find((item) => item.current);
    const toHref = currentItem?.href ?? null;
    const toLink = toHref ? linkRefs.current.get(toHref) : undefined;
    if (!toLink || !toHref) return;

    const flightGen = ++flightGenRef.current;

    const clearTimer = () => {
      if (flowTimerRef.current) {
        clearTimeout(flowTimerRef.current);
        flowTimerRef.current = 0;
      }
    };

    const commitPrevHref = () => {
      modulePrevHref = toHref;
      prevHrefRef.current = toHref;
    };

    /** Snap indicator to current link. RO skips while flowing; abort/snug may force. */
    const snugToCurrent = (opts?: { force?: boolean }) => {
      if (!opts?.force && isFlowingRef.current) return;
      isFlowingRef.current = false;
      applyIndicatorBox(indicator, measureLinkBox(nav, toLink), {
        isFlowing: false,
        scaleY: 1,
        durationMs: null,
      });
    };

    const fromHref = modulePrevHref;
    const fromLink = fromHref ? linkRefs.current.get(fromHref) : undefined;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (fromLink && fromHref && fromHref !== toHref) {
      runHybridIndicatorFlight(
        indicator,
        measureLinkBox(nav, fromLink),
        measureLinkBox(nav, toLink),
        () => measureLinkBox(nav, toLink),
        {
          setFlowing: (flowing) => {
            isFlowingRef.current = flowing;
          },
          clearTimer,
          scheduleSettle: (fn, delayMs) => {
            flowTimerRef.current = setTimeout(() => {
              if (flightGenRef.current !== flightGen) return;
              fn();
              commitPrevHref();
            }, delayMs);
          },
          isFlightCurrent: () => flightGenRef.current === flightGen,
        },
        { reduceMotion },
      );
      // reduceMotion snaps sync inside the helper — commit immediately.
      if (reduceMotion) commitPrevHref();
    } else {
      snugToCurrent({ force: true });
      commitPrevHref();
    }

    const ro = new ResizeObserver(() => {
      if (isFlowingRef.current) return;
      snugToCurrent();
    });
    ro.observe(nav);
    for (const child of nav.querySelectorAll(".portal-nav-link")) {
      ro.observe(child);
    }

    return () => {
      // Invalidate pending rAF settle / timeout so they cannot re-enter mid-flight.
      flightGenRef.current += 1;
      clearTimer();
      if (indicator.isConnected && toLink.isConnected && nav.isConnected) {
        snugToCurrent({ force: true });
      } else {
        isFlowingRef.current = false;
      }
      commitPrevHref();
      ro.disconnect();
    };
  }, [pathname]);

  return (
    <header className="portal-topnav" aria-label="Primary">
      <Link href="/portal" className="portal-brand">
        <span className="portal-brand-mark" aria-hidden="true">
          J
        </span>
        <span className="portal-brand-text">Joii</span>
      </Link>

      <nav ref={navRef} className="portal-nav-links" aria-label="Account">
        <span
          ref={indicatorRef}
          className="portal-nav-indicator"
          aria-hidden="true"
        />
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            ref={(el) => {
              if (el) linkRefs.current.set(item.href, el);
              else linkRefs.current.delete(item.href);
            }}
            className={
              item.current
                ? "portal-nav-link portal-nav-link--current"
                : "portal-nav-link"
            }
            aria-label={item.label}
            aria-current={item.current ? "page" : undefined}
          >
            {NAV_ICONS[item.label]}
            <span className="nav-label" aria-hidden="true">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <div className="portal-nav-utils">
        <button
          type="button"
          className="portal-ico"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
            <path d="M10 19a2 2 0 0 0 4 0" />
          </svg>
        </button>
        <span className="portal-nav-avatar" aria-hidden="true">
          JO
        </span>
      </div>
    </header>
  );
}
