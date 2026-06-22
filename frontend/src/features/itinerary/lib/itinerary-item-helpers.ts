import type { ItineraryItem } from "@/src/trip/types";

export function readItineraryDetailString(
  details: ItineraryItem["details"] | null | undefined,
  key: string,
): string {
  const value = details?.[key];
  return typeof value === "string" ? value.trim() : "";
}
