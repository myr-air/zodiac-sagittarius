/**
 * Visual placeholder sections for Account Home (stories, friends map, places).
 * No social / geo / POI fetches — draft-v3 chrome only.
 */

import type { ItinerarySummary } from "@/src/account/itinerary-summary";

const STORY_GRADIENTS = [
  "linear-gradient(160deg, #0d9488, #134e4a)",
  "linear-gradient(160deg, #f59e0b, #9a3412)",
  "linear-gradient(160deg, #6366f1, #312e81)",
  "linear-gradient(160deg, #ec4899, #9d174d)",
  "linear-gradient(160deg, #38bdf8, #0c4a6e)",
  "linear-gradient(160deg, #a3e635, #3f6212)",
];

const FACE_TONES = [
  "#94a3b8",
  "#64748b",
  "#78716c",
  "#a8a29e",
  "#71717a",
  "#57534e",
];

const PLACEHOLDER_PLACES = [
  {
    title: "Central Market - Chiang Mai",
    desc: "Night market stalls, local crafts, and street food walks for the whole party.",
    rating: "4.5",
    reviews: "47",
    guide: "Mortis A.",
    tags: [
      { label: "Shopping", tone: "" },
      { label: "Souvenirs", tone: "g" },
      { label: "Culture", tone: "p" },
    ],
    shot: "linear-gradient(135deg, #fbbf24, #b45309 55%, #1e2433)",
  },
  {
    title: "Grand Palace - Bangkok",
    desc: "Temple grounds and photo stops before the northbound train leg.",
    rating: "4.8",
    reviews: "128",
    guide: "Ken P.",
    tags: [
      { label: "History", tone: "" },
      { label: "Temple", tone: "g" },
      { label: "Photo", tone: "p" },
    ],
    shot: "linear-gradient(135deg, #fde68a, #0f766e 50%, #1e2433)",
  },
] as const;

const FRIEND_PINS = [
  { name: "Shelly A.", where: "Japan", className: "ah-pin--1", tone: "#94a3b8" },
  { name: "Edgar P.", where: "Argentina", className: "ah-pin--2", tone: "#78716c" },
  { name: "Maya K.", where: "Thailand", className: "ah-pin--3", tone: "#64748b" },
] as const;

function parseYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function formatDuration(startDate: string, endDate: string): string {
  const start = parseYmd(startDate);
  const end = parseYmd(endDate);
  if (!start || !end) return "—";
  const days = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
  );
  const nights = Math.max(0, days - 1);
  return `${days}d, ${nights}n`;
}

export function StoriesPlaceholder() {
  return (
    <section
      className="area-stories ah-stories"
      data-area="stories"
      data-source="placeholder"
      aria-label="Stories"
    >
      {STORY_GRADIENTS.map((gradient, i) => (
        <div
          key={i}
          className={i === 0 ? "ah-story ah-story--active" : "ah-story"}
        >
          <div
            className="ah-story-cover"
            style={{ background: gradient }}
            aria-hidden="true"
          />
          <div
            className="ah-story-face"
            style={{ background: FACE_TONES[i % FACE_TONES.length] }}
            aria-hidden="true"
          />
        </div>
      ))}
    </section>
  );
}

export function FriendsLocationPlaceholder() {
  return (
    <aside
      className="area-friends ah-friends"
      data-area="friends"
      data-source="placeholder"
    >
      <div className="ah-section-head">
        <div>
          <h2>Friends Location</h2>
          <p>Preview layout — live friend geo is not available yet</p>
        </div>
        <button className="ah-chip ah-chip--gray" type="button" disabled>
          Preview
        </button>
      </div>
      <div className="ah-map" aria-label="Friends map preview">
        <div className="ah-map-land" aria-hidden="true" />
        {FRIEND_PINS.map((pin) => (
          <div key={pin.name} className={`ah-pin ${pin.className}`}>
            <span
              className="ah-pin-face"
              style={{ background: pin.tone }}
              aria-hidden="true"
            />
            {pin.name} <span className="ah-pin-where">{pin.where}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function PlacesPlaceholder() {
  return (
    <section
      className="area-places ah-places"
      data-area="places"
      data-source="placeholder"
    >
      <div className="ah-section-head">
        <div>
          <h2>
            For your <span className="ah-places-accent">Thailand</span> Trip
          </h2>
          <p>Sample places for layout — not live recommendations</p>
        </div>
        <button className="ah-chip" type="button" disabled>
          Preview
        </button>
      </div>

      {PLACEHOLDER_PLACES.map((place) => (
        <article key={place.title} className="ah-place">
          <div
            className="ah-place-shot"
            style={{ background: place.shot }}
            aria-hidden="true"
          />
          <div>
            <h3>{place.title}</h3>
            <p className="ah-place-desc">{place.desc}</p>
            <div className="ah-place-meta">
              <span className="ah-stars">
                ★ {place.rating}{" "}
                <span className="ah-reviews">({place.reviews})</span>
              </span>
              <span className="ah-guide">
                Guide by: <strong>{place.guide}</strong>
              </span>
            </div>
            <div className="ah-tags">
              {place.tags.map((tag) => (
                <span
                  key={tag.label}
                  className={
                    tag.tone ? `ah-tag ah-tag--${tag.tone}` : "ah-tag"
                  }
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
          <div className="ah-place-actions">
            <button className="ah-sq" type="button" aria-label="Save" disabled>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z" />
              </svg>
            </button>
            <button className="ah-sq ah-sq--accent" type="button" aria-label="Open" disabled>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

type ItinerarySummaryCardProps = {
  itinerary: ItinerarySummary | null;
  displayName: string;
};

export function ItinerarySummaryCard({
  itinerary,
  displayName,
}: ItinerarySummaryCardProps) {
  const title = itinerary
    ? `Itinerary — ${itinerary.name}`
    : "Itinerary";

  return (
    <aside
      className="area-itinerary ah-itinerary"
      data-area="itinerary"
      data-source="live"
    >
      <h2>{title}</h2>
      <div className="ah-traveller">
        Traveller: <strong>{displayName}</strong>
      </div>
      <div
        className="ah-hero-shot"
        style={{
          background:
            "linear-gradient(145deg, #0f766e 0%, #115e59 40%, #1e2433 100%)",
        }}
        aria-hidden="true"
      />
      <div className="ah-details-label">Details:</div>
      <div className="ah-details">
        <div>
          Budget
          <strong>
            {itinerary?.budget.label ?? "Budget TBD"}
          </strong>
        </div>
        <div>
          Person
          <strong>{itinerary?.partySize ?? "—"}</strong>
        </div>
        <div>
          Durations
          <strong>
            {itinerary
              ? formatDuration(itinerary.startDate, itinerary.endDate)
              : "—"}
          </strong>
        </div>
      </div>
    </aside>
  );
}
