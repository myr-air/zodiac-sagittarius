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
    expect(globals).toMatch(/\.nav-label\s*\{\s*display:\s*none/);
    expect(globals).toMatch(
      /a\[aria-current=["']page["']\]\s+\.nav-label\s*\{\s*display:\s*inline/,
    );
    expect(globals).toMatch(/\.portal-nav-links\s*\{[^}]*justify-content:\s*center/s);
  });
});

describe("portal stub routes", () => {
  it("mounts Explore, Friends, and Settings stub pages with PortalStubPage titles", () => {
    for (const segment of ["explore", "friends", "settings"] as const) {
      const source = readFileSync(
        join(FRONTEND_ROOT, `app/portal/${segment}/page.tsx`),
        "utf8",
      );
      expect(source).toMatch(/PortalStubPage/);
      const title =
        segment === "explore"
          ? "Explore"
          : segment === "friends"
            ? "Friends"
            : "Settings";
      expect(source).toMatch(new RegExp(`title=["']${title}["']`));
    }
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
