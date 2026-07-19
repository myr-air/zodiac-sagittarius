/**
 * Compact portal shell breakpoint (px). Brand text / utility icons collapse here.
 * Nav labels: inactive always icon-only; active always icon + text (all widths).
 */
export const iconOnlyMaxWidthPx = 767;

export const portalNavItems = [
  { label: "Home", href: "/portal" },
  { label: "Explore", href: "/portal/explore" },
  { label: "Trips", href: "/portal/trips" },
  { label: "Friends", href: "/portal/friends" },
  { label: "Settings", href: "/portal/settings" },
] as const;

export type PortalNavItem = (typeof portalNavItems)[number];

export type PortalNavCurrentItem = PortalNavItem & { current: boolean };

function pathMatchesHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Mark exactly one primary-nav item current via longest matching href prefix. */
export function portalNavCurrent(pathname: string): PortalNavCurrentItem[] {
  let bestHref: string | null = null;
  for (const item of portalNavItems) {
    if (!pathMatchesHref(pathname, item.href)) continue;
    if (bestHref === null || item.href.length > bestHref.length) {
      bestHref = item.href;
    }
  }

  return portalNavItems.map((item) => ({
    ...item,
    current: bestHref !== null && item.href === bestHref,
  }));
}
