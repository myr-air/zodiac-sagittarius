type SpreadsheetColumnKey =
  | "day"
  | "date"
  | "time"
  | "activity"
  | "mapLink"
  | "duration"
  | "transportation"
  | "note";

export interface SpreadsheetHeader {
  rowIndex: number;
  columns: Partial<Record<SpreadsheetColumnKey, number>>;
}

const spreadsheetColumnAliases: Record<SpreadsheetColumnKey, string[]> = {
  day: ["day", "weekday"],
  date: ["date", "travel date"],
  time: ["time", "start time", "time range", "เวล่า", "เวลา"],
  activity: ["plans", "plan", "activity", "activities", "place", "stop"],
  mapLink: ["maps", "map", "map link", "map url", "link", "google maps"],
  duration: ["duration", "travel time", "estimate duration"],
  transportation: ["transportation", "transport", "transit", "route"],
  note: ["note", "notes", "remarks", "memo"],
};

export function findSpreadsheetHeader(rows: string[][]): SpreadsheetHeader | null {
  for (const [rowIndex, row] of rows.entries()) {
    const columns: SpreadsheetHeader["columns"] = {};
    for (const [columnIndex, cell] of row.entries()) {
      const key = spreadsheetColumnKey(cell);
      if (key && columns[key] === undefined) columns[key] = columnIndex;
    }
    const detectedColumns = Object.keys(columns).length;
    if (columns.activity !== undefined && detectedColumns >= 3) {
      return { rowIndex, columns };
    }
  }
  return null;
}

export function readSpreadsheetCell(
  row: string[],
  columnIndex: number | undefined,
): string {
  if (columnIndex === undefined) return "";
  return row[columnIndex] ?? "";
}

export function readSpreadsheetTitle(rows: string[][], headerIndex: number): string {
  for (let index = 0; index < headerIndex; index += 1) {
    const title = rows[index]?.find((cell) => cell.trim())?.trim();
    if (title) return title;
  }
  return "";
}

function spreadsheetColumnKey(value: string): SpreadsheetColumnKey | null {
  const normalized = normalizeHeaderLabel(value);
  for (const [key, aliases] of Object.entries(spreadsheetColumnAliases)) {
    if (aliases.includes(normalized)) return key as SpreadsheetColumnKey;
  }
  return null;
}

function normalizeHeaderLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}
