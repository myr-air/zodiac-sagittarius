import type { Locale } from "@/src/i18n/types";
import { activitySubtypeValues } from "@/src/trip/itinerary-core";
import { readItineraryDetailString } from "@/src/trip/itinerary-items";
import type { ActivitySubtype, ItineraryItem } from "@/src/trip/types";
import { type IconName } from "@/src/ui/icons";

export type TravelSubtype = ActivitySubtype;

export const travelSubtypes = activitySubtypeValues;

export const travelSubtypeIcons: Record<TravelSubtype, IconName> = {
  bus: "bus",
  car: "car",
  ferry: "ship",
  flight: "plane",
  shuttle: "bus",
  taxi: "car",
  train: "train",
  walk: "walk",
};

export function normalizeTravelSubtype(value: string | null | undefined): TravelSubtype | null {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z]+/g, "_");
  if (!normalized) return null;
  if (normalized === "plane" || normalized === "airline") return "flight";
  if (normalized === "rail" || normalized === "mtr") return "train";
  if (normalized === "boat" || normalized === "ship") return "ferry";
  if (normalized === "walking") return "walk";
  return travelSubtypes.includes(normalized as TravelSubtype)
    ? (normalized as TravelSubtype)
    : null;
}

export function withoutTravelSubtypeDetails(details: ItineraryItem["details"] | null | undefined): ItineraryItem["details"] {
  const nextDetails = { ...(details ?? {}) };
  delete nextDetails.subtype;
  if (normalizeTravelSubtype(readItineraryDetailString(details, "mode"))) {
    delete nextDetails.mode;
  }
  return nextDetails;
}

export function travelSubtypeForItem(item: ItineraryItem): TravelSubtype | null {
  if (item.activityType !== "travel") return null;
  const storedSubtype = normalizeTravelSubtype(item.activitySubtype ?? undefined);
  if (storedSubtype) return storedSubtype;

  const subtype = readItineraryDetailString(item.details, "subtype");
  const explicitSubtype = normalizeTravelSubtype(subtype);
  if (explicitSubtype) return explicitSubtype;

  const mode = readItineraryDetailString(item.details, "mode");
  const explicitMode = normalizeTravelSubtype(mode);
  if (explicitMode) return explicitMode;

  const haystack = `${item.transportation} ${item.activity}`.toLowerCase();
  if (/\bflight\b|\bplane\b|\bairline\b|เครื่องบิน|สายการบิน|(^|\s)บิน/.test(haystack)) return "flight";
  if (/\btrain\b|\brail\b|\bmtr\b|รถไฟ|ราง|สถานีรถไฟ/.test(haystack)) return "train";
  if (/\bbus\b|รถบัส|บัส/.test(haystack)) return "bus";
  if (/\btaxi\b|แท็กซี่/.test(haystack)) return "taxi";
  if (/\bferry\b|\bboat\b|เรือ|เฟอร์รี่/.test(haystack)) return "ferry";
  if (/\bwalk\b|\bwalking\b|เดิน/.test(haystack)) return "walk";
  if (/\bshuttle\b|รถรับส่ง/.test(haystack)) return "shuttle";
  if (/\bcar\b|\bdrive\b|รถยนต์/.test(haystack)) return "car";
  return null;
}

export function travelSubtypeOptions(locale: Locale): Array<{ icon: IconName; value: TravelSubtype; label: string }> {
  const labels: Record<Locale, Record<TravelSubtype, string>> = {
    en: {
      bus: "Bus",
      car: "Car",
      ferry: "Ferry",
      flight: "Flight",
      shuttle: "Shuttle",
      taxi: "Taxi",
      train: "Train",
      walk: "Walk",
    },
    th: {
      bus: "รถบัส",
      car: "รถยนต์",
      ferry: "เรือ",
      flight: "เครื่องบิน",
      shuttle: "รถรับส่ง",
      taxi: "แท็กซี่",
      train: "รถไฟ",
      walk: "เดิน",
    },
  };
  return travelSubtypes.map((type) => ({
    icon: travelSubtypeIcons[type],
    label: labels[locale][type],
    value: type,
  }));
}
