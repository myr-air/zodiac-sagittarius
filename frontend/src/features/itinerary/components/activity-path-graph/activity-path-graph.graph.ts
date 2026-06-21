import { parseTime, mainItineraryPathId, itineraryPathOptionsForDay, type ItineraryPathOption } from "@/src/trip/itinerary";
import {
  humanizePathId,
  itineraryItemPathId,
  mainItineraryPathName,
} from "@/src/trip/itinerary-paths";
import type { ItineraryItem } from "@/src/trip/types";
import { dotLaneGap, laneColors } from "./activity-path-graph.styles";
import type { GraphNode } from "./activity-path-graph.types";

export { buildEdgePath } from "./activity-path-graph.edge-path";
export { buildGraphEdges } from "./activity-path-graph.edges";

export interface PathMeta {
  name: string;
  color: string;
}

export function buildPathMetaForDay(
  day: string,
  graphItems: ItineraryItem[],
  pathOptions: ItineraryPathOption[],
): Map<string, PathMeta> {
  const options = new Map<string, string>([[mainItineraryPathId, mainItineraryPathName]]);
  for (const option of itineraryPathOptionsForDay(pathOptions, day)) {
    options.set(option.id, option.name);
  }

  for (const item of graphItems) {
    if (item.day !== day || item.pathRole !== "alternative" || !item.pathId) continue;
    options.set(item.pathId, item.pathName ?? humanizePathId(item.pathId));
  }

  return new Map(
    Array.from(options, ([id, name], index) => [id, {
      name,
      color: laneColors[index % laneColors.length] ?? laneColors[0],
    }]),
  );
}

export function buildLaneXByPathId(pathIds: string[], graphWidth: number): Map<string, number> {
  const laneCount = Math.max(1, pathIds.length);
  const firstLaneX = graphWidth / 2 - ((laneCount - 1) * dotLaneGap) / 2;
  return new Map(pathIds.map((pathId, index) => [pathId, firstLaneX + index * dotLaneGap]));
}

export function buildVisibleLanePathIds(rowItems: ItineraryItem[]): string[] {
  const pathIds = new Set<string>([mainItineraryPathId]);
  for (const item of rowItems) pathIds.add(itineraryItemPathId(item));
  return Array.from(pathIds);
}

export function buildGraphNodes(
  rowItems: ItineraryItem[],
  pathMetaById: Map<string, PathMeta>,
  laneXByPathId: Map<string, number>,
  graphWidth: number,
  itemYById: Map<string, number>,
): GraphNode[] {
  return rowItems.map((item) => {
    const pathId = itineraryItemPathId(item);
    const pathMeta = pathMetaById.get(pathId) ?? pathMetaById.get(mainItineraryPathId);
    const interval = itemInterval(item);
    return {
      id: item.id,
      color: pathMeta?.color ?? laneColors[0],
      end: interval?.end ?? null,
      item,
      pathId,
      pathName: pathMeta?.name ?? mainItineraryPathName,
      sourcePathId: pathId,
      start: interval?.start ?? null,
      x: laneXByPathId.get(pathId) ?? graphWidth / 2,
      y: itemYById.get(item.id) ?? 0,
    };
  });
}

function itemInterval(item: ItineraryItem): { start: number; end: number } | null {
  const start = parseTime(item.startTime);
  if (start === null) return null;
  return { start, end: start + (item.durationMinutes ?? 45) };
}
