"use client";

import Link from "next/link";
import { accountHomeComposition } from "@/src/account/account-home";

export function AccountHomeNav() {
  const { brand, topNav } = accountHomeComposition;

  return (
    <header
      className="sticky top-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-(--color-border) bg-(--color-surface) px-4 py-3 md:px-8"
      aria-label="Primary"
    >
      <Link
        href="/trips"
        className="inline-flex items-center gap-2.5 justify-self-start text-[22px] font-bold text-(--color-text) no-underline"
      >
        <span
          className="grid size-8 place-items-center rounded-[10px] bg-(--color-primary) text-[15px] font-bold text-(--color-on-primary)"
          aria-hidden="true"
        >
          J
        </span>
        {brand}
      </Link>

      <nav
        className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-(--color-surface-muted) p-1.5"
        aria-label="Account"
      >
        {topNav.map((item) =>
          item.current ? (
            <Link
              key={item.label}
              href="/trips"
              aria-current="page"
              className="shrink-0 rounded-full bg-(--color-account-home-navy) px-4 py-2.5 text-[13px] font-semibold text-white no-underline"
            >
              {item.label}
            </Link>
          ) : (
            <span
              key={item.label}
              className="shrink-0 rounded-full px-4 py-2.5 text-[13px] font-semibold text-(--color-text-subtle)"
            >
              {item.label}
            </span>
          ),
        )}
      </nav>

      <div className="inline-flex items-center gap-2.5 justify-self-end">
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full bg-(--color-surface-muted) text-(--color-text-muted)"
          aria-label="Settings"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M4 12h2m12 0h2M12 4v2m0 12v2" />
          </svg>
        </button>
        <button
          type="button"
          className="relative grid size-10 place-items-center rounded-full bg-(--color-surface-muted) text-(--color-text-muted)"
          aria-label="Notifications"
        >
          <span className="absolute top-2 right-2.5 size-1.5 rounded-full bg-(--color-danger) ring-2 ring-white" />
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
            <path d="M10 19a2 2 0 0 0 4 0" />
          </svg>
        </button>
        <span
          className="grid size-10 place-items-center rounded-full bg-(--color-primary) text-xs font-bold text-(--color-on-primary)"
          aria-hidden="true"
        >
          JO
        </span>
      </div>
    </header>
  );
}
