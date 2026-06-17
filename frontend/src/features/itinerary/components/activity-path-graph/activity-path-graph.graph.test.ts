import { describe, expect, it } from "vitest";
import { mainItineraryPathId, type ItineraryPathOption } from "@/src/trip/itinerary";
import { laneColors } from "./activity-path-graph.styles";
import type { ItineraryItem } from "@/src/trip/types";
import {
  buildEdgePath,
  buildGraphEdges,
  buildLaneXByPathId,
  buildPathMetaForDay,
  buildVisibleLanePathIds,
} from "./activity-path-graph.graph";

const itemForNode = (
  id: string,
  pathId?: string,
  pathRole: "main" | "alternative" = "main",
  day = "2026-06-19",
) => ({
  id,
  tripId: "trip-id",
  planVariantId: "plan-id",
  day,
  sortOrder: 100,
  startTime: "09:00",
  endTime: null,
  endOffsetDays: 0,
  activity: `Activity ${id}`,
  activityType: "travel",
  place: `Location ${id}`,
  linkLabel: "",
  mapLink: "",
  transportation: "Transit",
  details: {},
  durationMinutes: 45,
  note: "",
  createdBy: "user",
  updatedAt: "2026-06-01T00:00:00.000Z",
  version: 1,
  status: "planned",
  priority: "standard",
  timeMode: "local",
  itemKind: "stop",
  isPlanBlock: false,
  pathGroupId: `group-${id}`,
  pathId,
  pathName: pathId ? `Name ${pathId}` : undefined,
  pathRole,
  address: "",
  coordinates: null,
  parentItemId: null,
  advisoryNotes: [],
  link: "",
  notes: [],
} as unknown as ItineraryItem);

describe("activity-path-graph.graph", () => {
  it("builds path metadata with visible day-trip filtering", () => {
    const pathOptions: ItineraryPathOption[] = [
      { id: "main", name: "Main", scope: "trip" },
      { id: "trip-plan", name: "Trip Plan", scope: "trip" },
      { id: "day-plan", name: "Day plan", scope: "day", day: "2026-06-19" },
    ];

    const graphItems = [
      itemForNode("m"),
      itemForNode("a", "path-a", "alternative", "2026-06-19"),
    ];
    const pathMeta = buildPathMetaForDay("2026-06-19", graphItems, pathOptions);

    expect(Array.from(pathMeta.keys())).toEqual([
      mainItineraryPathId,
      "trip-plan",
      "day-plan",
      "path-a",
    ]);
    expect(pathMeta.get("trip-plan")).toEqual({
      color: laneColors[1],
      name: "Trip Plan",
    });
    expect(pathMeta.get("path-a")).toEqual({
      color: laneColors[3],
      name: "Name path-a",
    });
  });

  it("builds evenly spaced lane x coordinates", () => {
    expect(Array.from(buildLaneXByPathId(["main", "plan-a", "plan-b"], 100))).toEqual([
      ["main", 32],
      ["plan-a", 50],
      ["plan-b", 68],
    ]);
  });

  it("builds visible lane ids from row items and always includes main", () => {
    expect(buildVisibleLanePathIds([itemForNode("a", "plan-a", "alternative"), itemForNode("b", "plan-b", "alternative")])).toEqual([
      "main",
      "plan-a",
      "plan-b",
    ]);
  });

  it("builds straight line for same-path node edges", () => {
    const path = buildEdgePath({
      id: "a->b",
      color: "red",
      from: { id: "a", x: 10, y: 20, pathId: "main" },
      to: { id: "b", x: 10, y: 40, pathId: "main" },
    });
    expect(path).toBe("M 10 20 L 10 40");
  });

  it("keeps main-to-main fallback edge when no nodes", () => {
    const fallback = buildGraphEdges([], 100, 5, 55);
    expect(fallback).toHaveLength(1);
    expect(fallback[0]).toMatchObject({
      from: { id: "start", x: 50, y: 5, pathId: mainItineraryPathId },
      to: { id: "end", x: 50, y: 55, pathId: mainItineraryPathId },
      dashed: false,
    });
  });
});
