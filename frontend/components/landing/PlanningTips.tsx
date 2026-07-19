"use client";

import { useRef } from "react";
import { PLANNING_TIPS } from "@/src/landing/destinations";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function PlanningTips() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByDir = (dir: number) => {
    scrollerRef.current?.scrollBy({
      left: dir * 300,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  return (
    <section
      className="landing-section landing-reveal px-4 pt-12 pb-6"
      id="tips"
    >
      <div className="mx-auto w-full max-w-[1120px]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-[1.35rem] font-bold text-(--color-text)">
              Planning tips
            </h2>
            <p className="mt-1.5 mb-0 max-w-[42ch] text-sm text-(--color-text-muted)">
              How Joii keeps the group aligned — not third-party travel blogs.
            </p>
          </div>
          <div className="flex gap-2" aria-hidden="true">
            <button
              type="button"
              onClick={() => scrollByDir(-1)}
              aria-label="Previous tips"
              className="landing-control grid size-9 place-items-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-text) transition-colors duration-[180ms] hover:bg-(--color-surface-muted)"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollByDir(1)}
              aria-label="Next tips"
              className="landing-control grid size-9 place-items-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-text) transition-colors duration-[180ms] hover:bg-(--color-surface-muted)"
            >
              ›
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          id="tips-scroll"
          className="landing-scroller flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
        >
          {PLANNING_TIPS.map((tip) => (
            <article
              key={tip.title}
              className="w-[320px] shrink-0 snap-start overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
            >
              <div
                className="h-40 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${tip.imageUrl}")` }}
              />
              <div className="p-3.5">
                <h3 className="m-0 mb-2 text-[15px] font-bold text-(--color-text)">
                  {tip.title}
                </h3>
                <p className="m-0 text-[13px] leading-snug text-(--color-text-muted)">
                  {tip.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
