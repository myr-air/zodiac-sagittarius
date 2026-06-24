const monthNumbers: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export function parseSpreadsheetDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const namedMonth = trimmed.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/,
  );
  if (namedMonth) {
    const day = Number.parseInt(namedMonth[1] ?? "", 10);
    const month = monthNumbers[(namedMonth[2] ?? "").toLowerCase()];
    const year = normalizeYear(Number.parseInt(namedMonth[3] ?? "", 10));
    if (isValidDateParts(year, month, day)) return formatIsoDate(year, month, day);
  }
  const numericDate = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (numericDate) {
    const first = Number.parseInt(numericDate[1] ?? "", 10);
    const second = Number.parseInt(numericDate[2] ?? "", 10);
    const year = normalizeYear(Number.parseInt(numericDate[3] ?? "", 10));
    const day = first > 12 ? first : second;
    const month = first > 12 ? second : first;
    if (isValidDateParts(year, month, day)) return formatIsoDate(year, month, day);
  }
  return null;
}

function normalizeYear(year: number): number {
  if (year < 100) return year >= 70 ? 1900 + year : 2000 + year;
  return year;
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    year >= 1900 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  );
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}
