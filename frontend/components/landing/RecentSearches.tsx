"use client";

type RecentSearchesProps = {
  items: string[];
  onSelect: (query: string) => void;
};

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function RecentSearches({ items, onSelect }: RecentSearchesProps) {
  return (
    <section className="landing-section landing-reveal px-4 pt-12 pb-2" id="recent">
      <div className="mx-auto w-full max-w-[1120px]">
        <div className="mb-4">
          <h2 className="m-0 text-[1.35rem] font-bold text-(--color-text)">
            Your recent searches
          </h2>
        </div>
        {items.length === 0 ? (
          <p className="m-0 text-sm text-(--color-text-muted)">
            Searches you start from this device will show up here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {items.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSelect(item)}
                className="landing-control inline-flex items-center gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-4 py-3 text-[13px] font-semibold text-(--color-text) shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-colors duration-[180ms] hover:border-(--color-primary-border) hover:bg-(--color-primary-soft)"
              >
                <span className="text-(--color-route)">
                  <PinIcon />
                </span>
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
