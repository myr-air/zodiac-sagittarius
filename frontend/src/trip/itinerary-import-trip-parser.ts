import type { TripPlan } from "./types";
import type { ItineraryExportDocument } from "./itinerary-import-export-types";
import {
  isRecord,
  readOptionalNumber,
  readOptionalPlanStatus,
  readOptionalString,
  readPlanVariantKind,
  readString,
  statusFromPlanKind,
  unsupportedImportFileError,
} from "./itinerary-import-readers";

export function parseExportTrip(value: unknown): ItineraryExportDocument["trip"] {
  if (value === undefined || value === null) {
    return {
      id: "",
      name: "",
      destinationLabel: "",
      startDate: "",
      endDate: "",
      activePlanVariantId: "",
      mainTripPlanId: undefined,
      planVariants: [],
      tripPlans: [],
      partySize: undefined,
      defaultTimezone: undefined,
    };
  }
  if (!isRecord(value)) throw new Error("Unsupported itinerary import file.");
  const tripPlanAliases = readTripPlanAliases(value);
  return {
    id: readString(value, "id"),
    name: readString(value, "name"),
    destinationLabel: readString(value, "destinationLabel"),
    startDate: readString(value, "startDate"),
    endDate: readString(value, "endDate"),
    activePlanVariantId:
      readOptionalString(value, "activePlanVariantId") ??
      readOptionalString(value, "mainTripPlanId") ??
      "",
    mainTripPlanId:
      readOptionalString(value, "mainTripPlanId") ??
      readOptionalString(value, "activePlanVariantId"),
    planVariants: tripPlanAliases.planVariants,
    tripPlans: tripPlanAliases.tripPlans,
    partySize: readOptionalNumber(value, "partySize"),
    defaultTimezone: readOptionalString(value, "defaultTimezone"),
  };
}

function readTripPlanAliases(value: Record<string, unknown>): {
  planVariants: TripPlan[];
  tripPlans: TripPlan[];
} {
  const canonical = readTripPlans(value.tripPlans);
  const legacy = readTripPlans(value.planVariants);
  if (canonical.length > 0 && legacy.length > 0) {
    assertTripPlanAliasesMatch(canonical, legacy);
    return {
      planVariants: canonical,
      tripPlans: canonical,
    };
  }
  const plans = canonical.length > 0 ? canonical : legacy;
  return {
    planVariants: plans,
    tripPlans: plans,
  };
}

function readTripPlans(value: unknown): TripPlan[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((entry) => !isRecord(entry))) {
    throw unsupportedImportFileError();
  }
  return value.map((entry) => {
    const plan = entry as Record<string, unknown>;
    const kind = readPlanVariantKind(plan.kind);
    return {
      id: readString(plan, "id"),
      tripId: readString(plan, "tripId"),
      name: readString(plan, "name"),
      kind,
      status: readOptionalPlanStatus(plan.status) ?? statusFromPlanKind(kind),
      description: typeof plan.description === "string" ? plan.description : "",
      version: readOptionalNumber(plan, "version"),
    };
  });
}

function assertTripPlanAliasesMatch(
  canonical: TripPlan[],
  legacy: TripPlan[],
): void {
  if (canonical.length !== legacy.length) {
    throw unsupportedImportFileError();
  }
  for (const [index, canonicalPlan] of canonical.entries()) {
    const legacyPlan = legacy[index];
    if (
      !legacyPlan ||
      canonicalPlan.id !== legacyPlan.id ||
      canonicalPlan.name !== legacyPlan.name ||
      canonicalPlan.version !== legacyPlan.version ||
      canonicalPlan.kind !== legacyPlan.kind ||
      canonicalPlan.status !== legacyPlan.status
    ) {
      throw unsupportedImportFileError();
    }
  }
}
