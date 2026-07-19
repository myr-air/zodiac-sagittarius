import Link from "next/link";
import type { PortalTripRow } from "@/src/portal/trip-rows";

const THUMB_CLASSES = [
  "portal-pass-thumb portal-pass-thumb--g1",
  "portal-pass-thumb portal-pass-thumb--g2",
  "portal-pass-thumb portal-pass-thumb--g3",
  "portal-pass-thumb portal-pass-thumb--g4",
] as const;

function parseYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** Compact range: "12–18 Apr 2026" / "12 Apr – 3 May 2026". */
function formatDateRange(startYmd: string, endYmd: string): string {
  const start = parseYmd(startYmd);
  const end = parseYmd(endYmd);
  if (!start || !end) return `${startYmd} – ${endYmd}`;

  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();

  const day = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", timeZone: "UTC" });
  const month = (d: Date) =>
    d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  const year = (d: Date) =>
    d.toLocaleDateString("en-GB", { year: "numeric", timeZone: "UTC" });

  if (sameMonth) {
    return `${day(start)}–${day(end)} ${month(end)} ${year(end)}`;
  }
  if (sameYear) {
    return `${day(start)} ${month(start)} – ${day(end)} ${month(end)} ${year(end)}`;
  }
  return `${day(start)} ${month(start)} ${year(start)} – ${day(end)} ${month(end)} ${year(end)}`;
}

function stampCopy(row: PortalTripRow): { lines: string[]; tone: "admit" | "plan" } {
  const start = parseYmd(row.startDate);
  const dayMonth = start
    ? start
        .toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        })
        .toUpperCase()
    : row.startDate;

  if (row.status === "Planning") {
    return { lines: ["Planning", "Draft"], tone: "plan" };
  }
  const place = (row.destinationLabel || row.country || "Joii")
    .split(/\s+/)[0]!
    .slice(0, 10);
  return { lines: ["Admitted", place, dayMonth], tone: "admit" };
}

function coverMeta(row: PortalTripRow): string {
  const range = formatDateRange(row.startDate, row.endDate);
  return `${row.title} · archived · ${range}`;
}

type PortalTripRowsProps = {
  rows: PortalTripRow[];
  /** True when API returned trips but filter/search matched none. */
  noMatch?: boolean;
};

export function PortalTripRows({ rows, noMatch = false }: PortalTripRowsProps) {
  if (rows.length === 0 && noMatch) {
    return (
      <p className="portal-pass-nomatch" role="status">
        No trips match — try another filter or clear search.
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="portal-pass portal-pass--empty" role="status">
        <div className="portal-pass-photo">
          <div
            className="portal-pass-thumb portal-pass-thumb--empty"
            aria-hidden="true"
          />
          <div className="portal-pass-guilloche" aria-hidden="true" />
          <div
            className="portal-pass-stamp portal-pass-stamp--plan"
            aria-hidden="true"
          >
            <span>Awaiting</span>
            <span>Entry</span>
          </div>
          <div className="portal-pass-photo-cap">
            Ready when you are
            <small>No destination yet</small>
          </div>
        </div>
        <div className="portal-pass-data">
          <div className="portal-pass-header">
            <div>
              <div className="portal-pass-type">Trip pass</div>
              <div className="portal-pass-doc">Waiting for first trip</div>
            </div>
            <div className="portal-pass-crest" aria-hidden="true">
              J
            </div>
          </div>
          <h2>Your next trip starts here</h2>
          <div className="portal-pass-status portal-pass-status--plan">
            <i aria-hidden="true" />
            Empty
          </div>
          <p className="portal-pass-empty-lead">
            Create a trip or wait for an invite — destinations will gather on
            this atlas.
          </p>
          <div className="portal-pass-fields">
            <div className="portal-pass-field">
              <span>Role</span>
              <strong>—</strong>
            </div>
            <div className="portal-pass-field">
              <span>Party</span>
              <strong>—</strong>
            </div>
            <div className="portal-pass-field">
              <span>Dates</span>
              <strong>—</strong>
            </div>
            <div className="portal-pass-field">
              <span>Country</span>
              <strong>—</strong>
            </div>
          </div>
          <div className="portal-pass-mrz" aria-hidden="true">
            <span>P&lt;JOIIBLANKPAGE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
            <span>XXXXXXXXX&lt;0JOI0000000M0000000&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-trip-list">
      {rows.map((row, index) => {
        if (row.status === "Past") {
          return (
            <Link
              key={row.href}
              href={row.href}
              className="portal-pass portal-pass--cover"
            >
              <span className="portal-pass-mark" aria-hidden="true">
                J
              </span>
              <div className="portal-pass-cover-copy">
                <h2>Passport</h2>
                <p>{coverMeta(row)}</p>
              </div>
            </Link>
          );
        }

        const stamp = stampCopy(row);
        const dates = formatDateRange(row.startDate, row.endDate);
        const place = row.country || row.destinationLabel || "Destination";

        return (
          <Link key={row.href} href={row.href} className="portal-pass">
            <div className="portal-pass-photo">
              <div
                className={THUMB_CLASSES[index % THUMB_CLASSES.length]}
                aria-hidden="true"
              />
              <div className="portal-pass-guilloche" aria-hidden="true" />
              <div
                className={
                  stamp.tone === "plan"
                    ? "portal-pass-stamp portal-pass-stamp--plan"
                    : "portal-pass-stamp"
                }
                aria-hidden="true"
              >
                {stamp.lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
              <div className="portal-pass-photo-cap">
                {place}
                <small>Destination page</small>
              </div>
            </div>
            <div className="portal-pass-data">
              <div className="portal-pass-header">
                <div>
                  <div className="portal-pass-type">Joii travel pass</div>
                  <div className="portal-pass-doc">No. {row.docNo}</div>
                </div>
                <div className="portal-pass-crest" aria-hidden="true">
                  J
                </div>
              </div>
              <h2>{row.title}</h2>
              <div
                className={
                  row.status === "Upcoming"
                    ? "portal-pass-status portal-pass-status--live"
                    : "portal-pass-status portal-pass-status--plan"
                }
              >
                <i aria-hidden="true" />
                {row.status}
              </div>
              <div className="portal-pass-fields">
                <div className="portal-pass-field">
                  <span>Role</span>
                  <strong>{row.roleLabel}</strong>
                </div>
                <div className="portal-pass-field">
                  <span>Party</span>
                  <strong>
                    {row.partySize}{" "}
                    {row.partySize === 1 ? "traveler" : "travelers"}
                  </strong>
                </div>
                <div className="portal-pass-field">
                  <span>Dates</span>
                  <strong>{dates}</strong>
                </div>
                <div className="portal-pass-field">
                  <span>Country</span>
                  <strong>{place}</strong>
                </div>
              </div>
              <div className="portal-pass-mrz" aria-hidden="true">
                <span>{row.mrzLines[0]}</span>
                <span>{row.mrzLines[1]}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
