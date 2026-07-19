"use client";

import { useRef, useState } from "react";
import { TRIP_IDEAS } from "@/src/landing/destinations";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function MetaIcon({ kind }: { kind: "place" | "calendar" }) {
  if (kind === "place") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function TripIdeas() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"recent" | "upcoming">("recent");

  const scrollByDir = (dir: number) => {
    scrollerRef.current?.scrollBy({
      left: dir * 300,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  return (
    <section className="landing-section landing-reveal px-4 pt-12 pb-2" id="trips">
      <div className="mx-auto w-full max-w-[1120px]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-[1.35rem] font-bold text-(--color-text)">
              Trip ideas
            </h2>
            <p className="mt-1.5 mb-0 max-w-[42ch] text-sm text-(--color-text-muted)">
              Sample postcards for the public landing. Real “My trips” appears after you
              have trips.
            </p>
          </div>
          <div className="flex gap-2" aria-hidden="true">
            <button
              type="button"
              onClick={() => scrollByDir(-1)}
              aria-label="Previous"
              className="landing-control grid size-9 place-items-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-text) transition-colors duration-[180ms] hover:bg-(--color-surface-muted)"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollByDir(1)}
              aria-label="Next"
              className="landing-control grid size-9 place-items-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-text) transition-colors duration-[180ms] hover:bg-(--color-surface-muted)"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mb-[18px] flex gap-2" role="tablist" aria-label="Trip filter">
          {(
            [
              ["recent", "Recent"],
              ["upcoming", "Upcoming"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={`landing-control min-h-9 rounded-full border px-4 text-[13px] font-bold transition-colors duration-[180ms] ${
                filter === id
                  ? "border-(--color-text) bg-(--color-text) text-white"
                  : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted)"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          ref={scrollerRef}
          id="trips-scroll"
          className="landing-scroller flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
        >
          {TRIP_IDEAS.map((trip) => (
            <article
              key={trip.title}
              className="w-[280px] shrink-0 snap-start overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
            >
              <div
                className="relative h-[168px] bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${trip.imageUrl}")` }}
              >
                <button
                  type="button"
                  aria-label="More"
                  className="absolute top-2.5 right-2.5 size-8 rounded-full border-0 bg-white/90 text-sm font-bold"
                >
                  ···
                </button>
                <div
                  className="absolute right-3 -bottom-3.5 size-9 rounded-full border-2 border-white bg-cover bg-center"
                  style={{ backgroundImage: `url("${trip.avatarUrl}")` }}
                  aria-hidden
                />
              </div>
              <div className="px-3.5 pt-[22px] pb-3.5">
                <h3 className="m-0 mb-2 text-[15px] font-bold text-(--color-text)">
                  {trip.title}
                </h3>
                <p className="m-0 mb-1 flex items-center gap-1.5 text-xs font-medium text-(--color-text-muted)">
                  <span className="text-(--color-route)">
                    <MetaIcon kind="place" />
                  </span>
                  {trip.places}
                </p>
                <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-(--color-text-muted)">
                  <span className="text-(--color-route)">
                    <MetaIcon kind="calendar" />
                  </span>
                  {trip.dates}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
