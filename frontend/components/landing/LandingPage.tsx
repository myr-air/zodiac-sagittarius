"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CreateEntryStub } from "./CreateEntryStub";
import { DestinationCards } from "./DestinationCards";
import { HeroParallax } from "./HeroParallax";
import { LandingFooter } from "./LandingFooter";
import { PlanQueryBar } from "./PlanQueryBar";
import { PlanningTips } from "./PlanningTips";
import { RecentSearches } from "./RecentSearches";
import { TripAccessBand } from "./TripAccessBand";
import { TripIdeas } from "./TripIdeas";
import {
  createTripFromQuery,
  defaultApiBaseUrl,
} from "@/src/landing/create-trip";
import {
  appendRecent,
  loadRecent,
  saveRecent,
} from "@/src/landing/recent-searches";

const RECENT_EVENT = "joii-recent-change";
const EMPTY_RECENT: string[] = [];

let cachedRecentSnapshot: string[] = EMPTY_RECENT;

function subscribeRecent(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(RECENT_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(RECENT_EVENT, onStoreChange);
  };
}

function sameRecentList(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

function getRecentSnapshot(): string[] {
  const next = loadRecent(window.localStorage);
  if (sameRecentList(cachedRecentSnapshot, next)) {
    return cachedRecentSnapshot;
  }
  cachedRecentSnapshot = next;
  return cachedRecentSnapshot;
}

function getRecentServerSnapshot(): string[] {
  return EMPTY_RECENT;
}

function subscribeHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function getCreateHashSnapshot(): boolean {
  return window.location.hash === "#create";
}

function getCreateHashServerSnapshot(): boolean {
  return false;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function useSectionReveals() {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>(".landing-reveal");
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      nodes.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export function LandingPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recent = useSyncExternalStore(
    subscribeRecent,
    getRecentSnapshot,
    getRecentServerSnapshot,
  );
  const showCreateHash = useSyncExternalStore(
    subscribeHash,
    getCreateHashSnapshot,
    getCreateHashServerSnapshot,
  );
  const showCreate = showCreateHash || createBusy || Boolean(createError);

  useSectionReveals();

  const focusHeroQuery = useCallback(() => {
    inputRef.current?.focus();
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || createBusy) return;

    const next = appendRecent(recent, trimmed);
    saveRecent(window.localStorage, next);
    window.dispatchEvent(new Event(RECENT_EVENT));
    window.location.hash = "create";
    setCreateError(null);
    setCreateBusy(true);

    const outcome = await createTripFromQuery(trimmed, {
      fetch: globalThis.fetch.bind(globalThis),
      apiBaseUrl: defaultApiBaseUrl(),
      storage: window.sessionStorage,
      navigate: (route) => {
        router.push(route);
      },
    });

    setCreateBusy(false);
    if (!outcome.ok) {
      setCreateError(outcome.error);
    }
  }, [createBusy, query, recent, router]);

  const handleSeed = useCallback(
    (seed: string) => {
      setQuery(seed);
      focusHeroQuery();
    },
    [focusHeroQuery],
  );

  const handleRecentSelect = useCallback(
    (value: string) => {
      setQuery(value);
      focusHeroQuery();
    },
    [focusHeroQuery],
  );

  return (
    <div className="overflow-x-hidden bg-(--color-page)">
      <header className="border-b border-(--color-border) bg-(--color-surface)">
        <div className="mx-auto flex w-full max-w-[1120px] items-center gap-4 px-4 py-3.5">
          <p className="m-0 shrink-0 text-[1.35rem] font-bold tracking-tight text-(--color-primary)">
            Joii
          </p>
          <label className="hidden max-w-[220px] min-h-10 flex-1 items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-muted) px-3.5 md:flex">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="text-(--color-text-subtle)"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path
                d="M16.5 16.5 21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              placeholder="Search"
              aria-label="Search"
              className="w-full border-0 bg-transparent text-[13px] outline-none"
            />
          </label>
          <nav
            className="ml-auto hidden items-center gap-1 md:flex"
            aria-label="Primary"
          >
            <Link
              href="/"
              className="inline-flex min-h-10 items-center rounded-full bg-(--color-primary) px-3.5 text-[13px] font-semibold text-(--color-on-primary)"
            >
              Home
            </Link>
            <a
              href="#destinations"
              className="inline-flex min-h-10 items-center rounded-full px-3.5 text-[13px] font-semibold text-(--color-text-muted) transition-colors duration-[180ms] hover:text-(--color-text)"
            >
              Explore
            </a>
            <a
              href="#trips"
              className="inline-flex min-h-10 items-center rounded-full px-3.5 text-[13px] font-semibold text-(--color-text-muted) transition-colors duration-[180ms] hover:text-(--color-text)"
            >
              Trip ideas
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <a
              href="/login"
              className="inline-flex min-h-10 items-center rounded-(--radius-md) px-3 text-[13px] font-bold text-(--color-text) transition-colors duration-[180ms] hover:bg-(--color-surface-muted)"
            >
              Log in
            </a>
            <a
              href="/trip-access"
              className="inline-flex min-h-10 items-center rounded-(--radius-md) border border-(--color-border) px-3 text-[13px] font-bold text-(--color-text) transition-colors duration-[180ms] hover:bg-(--color-surface-muted)"
            >
              Trip access
            </a>
          </div>
        </div>
      </header>

      <HeroParallax>
        <p className="landing-hero__brand m-0 mb-2 text-[clamp(2.75rem,8vw,4.5rem)] font-bold leading-none tracking-tight [text-shadow:0_2px_24px_rgba(0,0,0,0.4)]">
          Joii
        </p>
        <h1 className="m-0 mb-7 text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight [text-shadow:0_2px_20px_rgba(0,0,0,0.35)]">
          Plan the trip the group can share
        </h1>
        <PlanQueryBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSubmit}
          inputRef={inputRef}
        />
        <p className="mt-3.5 mb-0 text-[13px] font-medium text-white/88 [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
          One field to start — no sign-in required. Dates and party come later.
        </p>
      </HeroParallax>

      <CreateEntryStub
        query={query}
        visible={showCreate}
        busy={createBusy}
        error={createError}
      />

      <main>
        <TripIdeas />
        <DestinationCards onSeed={handleSeed} />
        <TripAccessBand />
        <RecentSearches items={recent} onSelect={handleRecentSelect} />
        <PlanningTips />
      </main>

      <LandingFooter />
    </div>
  );
}
