/**
 * Upcoming trip cards for Account Home (draft v3).
 */

import type { UpcomingTripCard } from "@/src/account/trip-cards";

const TRIP_GRADIENTS = [
  "linear-gradient(145deg, #0f766e 0%, #134e4a 45%, #1e2433 100%)",
  "linear-gradient(145deg, #ff7a1a 0%, #c2410c 50%, #1e2433 100%)",
  "linear-gradient(145deg, #7c3aed 0%, #4c1d95 50%, #1e2433 100%)",
];

function parseYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function formatDayMonth(ymd: string): string {
  const d = parseYmd(ymd);
  if (!d) return ymd;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function tripDayCount(startDate: string, endDate: string): number {
  const start = parseYmd(startDate);
  const end = parseYmd(endDate);
  if (!start || !end) return 1;
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

type UpcomingTripsProps = {
  trips: UpcomingTripCard[];
};

export function UpcomingTrips({ trips }: UpcomingTripsProps) {
  return (
    <section className="area-trips" data-area="trips" data-source="live">
      <div className="ah-section-head">
        <div>
          <h2>Upcoming Trip</h2>
          <p>Remember your upcoming trips!</p>
        </div>
        <button className="ah-chip" type="button">
          Details
        </button>
      </div>

      {trips.length === 0 ? (
        <p className="ah-empty">No upcoming trips yet.</p>
      ) : (
        <div className="ah-trip-row">
          {trips.map((trip, index) => {
            const days = tripDayCount(trip.startDate, trip.endDate);
            const muted = index > 0;
            return (
              <article key={trip.id} className="ah-trip">
                <div
                  className="ah-trip-thumb"
                  style={{
                    background: TRIP_GRADIENTS[index % TRIP_GRADIENTS.length],
                  }}
                  aria-hidden="true"
                />
                <div>
                  <h3>{trip.title}</h3>
                  <div className="ah-trip-country">{trip.country}</div>
                  <div className="ah-trip-meta">
                    Party: <b>{trip.partySize}</b>
                  </div>
                </div>
                <div
                  className={
                    muted ? "ah-date-badge ah-date-badge--muted" : "ah-date-badge"
                  }
                >
                  <div className="ah-date-badge__top">
                    {formatDayMonth(trip.startDate)}
                  </div>
                  <div className="ah-date-badge__bot">
                    {days} {days === 1 ? "Day" : "Days"}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
