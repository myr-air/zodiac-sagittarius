export function parseYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** Compact range: "12–18 Apr 2026" / "12 Apr – 3 May 2026". */
export function formatDateRange(startYmd: string, endYmd: string): string {
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
