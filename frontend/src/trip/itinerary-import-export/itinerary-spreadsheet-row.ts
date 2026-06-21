import { itemKindFromActivityType } from "../itinerary-item-kind";
import {
  hasBookingHint,
  parseMoneyHint,
} from "./itinerary-spreadsheet-records";
import type { ItineraryAdvisory, ItineraryItem } from "../types";

export function classifySpreadsheetRow({
  activity,
  mapLink,
  rawActivity,
  rawTime,
  sourceNote,
  transportation,
}: {
  activity: string;
  mapLink: string;
  rawActivity: string;
  rawTime: string;
  sourceNote: string;
  transportation: string;
}): {
  activityType: ItineraryItem["activityType"];
  itemKind: ItineraryItem["itemKind"];
  isPlanBlock: boolean;
  isSubActivity: boolean;
  status: ItineraryItem["status"];
  priority: ItineraryItem["priority"];
  fallbackActivity: string;
  labels: string[];
  advisories: ItineraryAdvisory[];
} {
  const haystack = `${activity} ${transportation} ${sourceNote}`.toLowerCase();
  const hasRouteDash = /\S\s+-\s+\S/.test(activity);
  const isTravel =
    hasRouteDash ||
    /(?:->|→|\bairport\b|\bstation\b|\bsubway\b|\bmetro\b|\bbus\b|\btrain\b|\btaxi\b|\bferry\b|\bflight\b|\bmtr\b|\bdidi\b)/i.test(
      haystack,
    );
  const isFood = /(?:breakfast|lunch|dinner|restaurant|cafe|dessert|noodle|dim sum|dimsum|food|congee)/i.test(
    haystack,
  );
  const isStay = /(?:hotel|check[- ]?in|check[- ]?out|leave bag)/i.test(haystack);
  const isShopping = /(?:shopping|mall|market)/i.test(haystack);
  const isSubActivity = /^\s{2,}|^\s*(?:[-*•·]|>)\s+/.test(rawActivity);
  const isUntimedTravel = isTravel && !rawTime.trim();
  const isUntimedGroupHeading =
    Boolean(activity) &&
    !rawTime.trim() &&
    !mapLink &&
    !transportation &&
    !sourceNote;
  const labels = [
    isTravel ? "journey" : "",
    isFood ? "food" : "",
    isStay ? "stay" : "",
    isShopping ? "shopping" : "",
    isSubActivity ? "sub-activity" : "",
    isUntimedTravel ? "flexible-journey" : "",
    isUntimedGroupHeading ? "parent-block" : "",
    hasBookingHint(sourceNote) ? "booking-hint" : "",
    parseMoneyHint(sourceNote) ? "plan-estimate" : "",
  ].filter(Boolean);
  const advisories: ItineraryAdvisory[] = [];
  if (!activity && (mapLink || sourceNote || transportation)) {
    advisories.push({
      code: "csv-missing-activity",
      label: "Imported row did not include an activity name.",
      severity: "warning",
    });
  }
  const activityType: ItineraryItem["activityType"] = isTravel
    ? "travel"
    : isFood
      ? "food"
      : isStay
        ? "stay"
        : isShopping
          ? "shopping"
          : "experience";
  return {
    activityType,
    itemKind: itemKindFromActivityType(activityType),
    isPlanBlock: isUntimedTravel || isUntimedGroupHeading,
    isSubActivity,
    status: hasBookingHint(sourceNote) ? "idea" : "planned",
    priority: hasBookingHint(sourceNote) || parseMoneyHint(sourceNote) ? "high" : "normal",
    fallbackActivity: sourceNote || transportation || "Imported itinerary note",
    labels,
    advisories,
  };
}

export function inferSpreadsheetPlace(activity: string): string {
  const normalized = normalizeWhitespace(activity);
  const arrowParts = normalized.split(/(?:->|→)/);
  if (arrowParts.length > 1) {
    return arrowParts[arrowParts.length - 1]?.trim() ?? normalized;
  }
  return normalized
    .replace(/^(?:breakfast|lunch|dinner|dessert)\s+at\s+/i, "")
    .replace(/^check[- ]?in\s+at\s+/i, "")
    .trim();
}

export function stripSubItemPrefix(value: string): string {
  return value.replace(/^\s*(?:[-*•·]|>)\s+/, "");
}

export function isSpreadsheetDayMarker(value: string): boolean {
  return /^day\s*\d+/i.test(value.trim());
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
