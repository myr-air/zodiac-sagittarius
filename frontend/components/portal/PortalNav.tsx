"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { portalNavCurrent } from "@/src/portal/portal-nav";

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

export function PortalNav() {
  const pathname = usePathname() ?? "/portal";
  const items = portalNavCurrent(pathname);

  return (
    <header className="portal-topnav" aria-label="Primary">
      <Link href="/portal" className="portal-brand">
        <span className="portal-brand-mark" aria-hidden="true">
          J
        </span>
        <span className="portal-brand-text">Joii</span>
      </Link>

      <nav className="portal-nav-links" aria-label="Account">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
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
