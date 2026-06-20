import {
  humanizePathId,
  mainItineraryPathId,
  mainItineraryPathName,
} from "./itinerary-path-identifiers";
import type { ItineraryItem, ItineraryPath, ItineraryPathScope } from "./types";

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
  const options = new Map<string, ItineraryPathOption>();
  options.set(mainItineraryPathId, {
    id: mainItineraryPathId,
    name: mainItineraryPathName,
    scope: "trip",
  });

  for (const path of paths) {
    options.set(path.id, {
      id: path.id,
      name: path.name,
      scope: path.scope,
      day: path.day,
    });
  }

  for (const item of items) {
    if (
      item.pathRole !== "alternative" ||
      !item.pathId ||
      options.has(item.pathId)
    )
      continue;
    const generatedDay = generatedDayFromPathId(item.pathId);
    options.set(item.pathId, {
      id: item.pathId,
      name: item.pathName || humanizePathId(item.pathId),
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
