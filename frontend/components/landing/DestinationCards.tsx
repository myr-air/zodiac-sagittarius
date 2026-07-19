"use client";

import { POPULAR_DESTINATIONS } from "@/src/landing/destinations";

type DestinationCardsProps = {
  onSeed: (seed: string) => void;
};

export function DestinationCards({ onSeed }: DestinationCardsProps) {
  return (
    <section className="landing-section landing-reveal px-4 pt-12 pb-2" id="destinations">
      <div className="mx-auto w-full max-w-[1120px]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-[1.35rem] font-bold text-(--color-text)">
              Popular destinations
            </h2>
            <p className="mt-1.5 mb-0 max-w-[42ch] text-sm text-(--color-text-muted)">
              Tap a place to seed Start Planning — still no auth wall.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR_DESTINATIONS.map((dest) => (
            <button
              key={dest.seed}
              type="button"
              onClick={() => onSeed(dest.seed)}
              className="landing-control relative min-h-[280px] overflow-hidden rounded-(--radius-lg) bg-cover bg-center bg-no-repeat text-left shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-[transform,box-shadow] duration-[180ms] hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)"
              style={{ backgroundImage: `url("${dest.imageUrl}")` }}
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(15,23,42,0.75))]"
              />
              <span className="absolute bottom-4 left-4 z-1 text-[1.25rem] font-bold text-white">
                {dest.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
