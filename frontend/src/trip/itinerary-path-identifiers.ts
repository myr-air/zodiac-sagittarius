import type { ItineraryItem } from "./types";

export const mainItineraryPathId = "main";
export const mainItineraryPathName = "Main" as const;

export function itineraryItemPathId(item: ItineraryItem): string {
  return item.pathRole === "alternative" ? item.pathId ?? item.id : mainItineraryPathId;
}

export function humanizePathId(pathId: string): string {
  return pathId
    .replace(/^path-/, "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ") || pathId;
}
