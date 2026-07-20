import type { CreateSeedDestination } from "./seed";

/** Timing modes from AI / mock classify (draft: flexible | months | exact). */
export type ClassifiedWhen =
  | { mode: "flexible" }
  | {
      mode: "months";
      startY: number;
      startM: number;
      endY: number;
      endM: number;
    }
  | { mode: "exact"; start: string; end: string };

/** Soft AI recommendations alongside structured seed (optional on local mock). */
export type TripSeedRecommendations = {
  styles: string[];
  relatedPlaces: string[];
  seasonHint?: string | null;
};

export type ClassifiedTripSeed = {
  name: string;
  destinations: CreateSeedDestination[];
  when: ClassifiedWhen;
  confidence?: string;
  recommendations?: TripSeedRecommendations;
};

/** Slim account/public create body — never carries join credentials. */
export type CreateTripSeedPayload = {
  name: string;
  destinationLabel: string;
  startDate?: string;
  endDate?: string;
};

const ISO_DATE = /\d{4}-\d{2}-\d{2}/g;
const MONTH_INDEX: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/** Mission / mock clock year for month-window classification. */
function classifyYear(): number {
  return new Date().getFullYear();
}

function primaryLabel(destinations: CreateSeedDestination[]): string {
  return (
    destinations.find((d) => d.role === "primary")?.label ??
    destinations[0]?.label ??
    ""
  );
}

function parseMonthNames(text: string): number[] {
  const found: number[] = [];
  const re = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi;
  for (const match of text.matchAll(re)) {
    const idx = MONTH_INDEX[match[1].toLowerCase()];
    if (idx !== undefined) found.push(idx);
  }
  return found;
}

function parseRoleDestinations(text: string): CreateSeedDestination[] | null {
  const destinations: CreateSeedDestination[] = [];
  const re =
    /\b([A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)*)\s+(primary|optional)\b/g;
  for (const match of text.matchAll(re)) {
    destinations.push({
      label: match[1],
      role: match[2].toLowerCase() as "primary" | "optional",
    });
  }
  return destinations.length > 0 ? destinations : null;
}

/**
 * Map free-text seed into structured { name, destinations[], when }.
 * Mock heuristics for draft examples (flexible | months | exact).
 */
export function classifyTripSeed(text: string): ClassifiedTripSeed {
  const trimmed = text.trim();
  const isoDates = [...trimmed.matchAll(ISO_DATE)].map((m) => m[0]);

  // Exact — ISO date range (+ optional "call it <name>")
  if (isoDates.length >= 2) {
    const callIt = trimmed.match(/call it\s+(.+?)(?:\.|$)/i);
    const placeMatch = trimmed.match(
      /^([A-Za-z][A-Za-z\s]*?)\s+(?:road\s+)?trip\b/i,
    );
    const label = placeMatch?.[1]?.trim() ?? "";
    const destinations: CreateSeedDestination[] = label
      ? [{ label, role: "primary" }]
      : [];
    return {
      name: callIt?.[1]?.trim() || label,
      destinations,
      when: { mode: "exact", start: isoDates[0], end: isoDates[1] },
    };
  }

  // Months — primary/optional places + month names
  const roleDests = parseRoleDestinations(trimmed);
  const months = parseMonthNames(trimmed);
  if (roleDests && months.length >= 2) {
    const startY = classifyYear();
    const startM = months[0];
    const endM = months[1];
    const endY = endM < startM ? startY + 1 : startY;
    return {
      name: primaryLabel(roleDests),
      destinations: roleDests,
      when: { mode: "months", startY, startM, endY, endM },
    };
  }

  // Flexible — place + undecided timing (default mock path)
  const beforeWith = trimmed.match(
    /^(.+?)\s+with\b/i,
  );
  const label =
    beforeWith?.[1]?.trim() ||
    trimmed.split(/[,.]/)[0]?.trim() ||
    trimmed;
  return {
    name: label,
    destinations: [{ label, role: "primary" }],
    when: { mode: "flexible" },
  };
}

/**
 * Map classified seed into a create API payload.
 * Never includes joinId / joinPassword.
 */
export function toCreatePayload(
  seed: ClassifiedTripSeed,
): CreateTripSeedPayload {
  const payload: CreateTripSeedPayload = {
    name: seed.name,
    destinationLabel: primaryLabel(seed.destinations),
  };
  if (seed.when.mode === "exact") {
    payload.startDate = seed.when.start;
    payload.endDate = seed.when.end;
  }
  return payload;
}
