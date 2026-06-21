import {
  humanizePathId,
  itineraryItemPathId,
  mainItineraryPathId,
  mainItineraryPathName,
} from "./itinerary-path-identifiers";
import type { ItineraryItem, ItineraryPath, ItineraryPathScope } from "../types";

export interface ItineraryPathOption {
  id: string;
  name: string;
  scope: ItineraryPathScope;
  day?: string;
}

export function deriveItineraryPathOptions(
  items: ItineraryItem[],
  paths: ItineraryPath[] = [],
): ItineraryPathOption[] {
  return completeItineraryPathOptions(
    paths.map((path) => ({
      id: path.id,
      name: path.name,
      scope: path.scope,
      day: path.day,
    })),
    items,
  );
}

export function completeItineraryPathOptions(
  pathOptions: ItineraryPathOption[],
  items: ItineraryItem[],
): ItineraryPathOption[] {
  const options = new Map<string, ItineraryPathOption>();
  options.set(mainItineraryPathId, {
    id: mainItineraryPathId,
    name: mainItineraryPathName,
    scope: "trip",
  });

  for (const option of pathOptions) {
    options.set(option.id, option);
  }

  for (const item of items) {
    const pathId = itineraryItemPathId(item);
    if (options.has(pathId)) continue;
    const generatedDay = generatedDayFromPathId(pathId);
    options.set(pathId, {
      id: pathId,
      name: item.pathName || (pathId === mainItineraryPathId ? mainItineraryPathName : humanizePathId(pathId)),
      scope: generatedDay ? "day" : "trip",
      day: generatedDay || undefined,
    });
  }

  return Array.from(options.values());
}

export function itineraryPathOptionsForDay(
  pathOptions: ItineraryPathOption[],
  day: string,
): ItineraryPathOption[] {
  return pathOptions.filter(
    (option) =>
      option.id === mainItineraryPathId ||
      option.scope === "trip" ||
      option.day === day,
  );
}

function generatedDayFromPathId(pathId: string): string | null {
  const match = pathId.match(/^path-(\d{4}-\d{2}-\d{2})-sub-[a-z]+$/i);
  return match?.[1] ?? null;
}
