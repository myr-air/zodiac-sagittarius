import { describe, expect, it } from "vitest";
import {
  createGraphEdgeCollector,
  findBestPreviousConnectableNode,
  isContinuousNode,
  shouldDashGapEdge,
} from "./activity-path-graph.edge-routing";
import { makeItineraryGraphItem } from "./activity-path-graph.test-fixtures";
import type { GraphNode } from "./activity-path-graph.types";

function graphNode(id: string, patch: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    color: "red",
    end: 60,
    item: makeItineraryGraphItem({ id }),
    pathId: "main",
    pathName: "Main",
    sourcePathId: "main",
    start: 0,
    x: 10,
    y: 10,
    ...patch,
  };
}

describe("activity path graph edge routing", () => {
  it("collects unique edges and skips self or overlapping node edges", () => {
    const { edges, pushEdge } = createGraphEdgeCollector();
    const first = graphNode("first", { start: 0, end: 60, y: 20 });
    const second = graphNode("second", { start: 0, end: 60, y: 20 });
    const later = graphNode("later", { start: 90, end: 120, y: 80 });

    pushEdge(first, first, "red");
    pushEdge(first, second, "red");
    pushEdge(first, later, "red", true);
    pushEdge(first, later, "red", true);

    expect(edges).toEqual([
      expect.objectContaining({
        id: "first->later:dashed",
        dashed: true,
        from: first,
        to: later,
      }),
    ]);
  });

  it("classifies continuous and dashed gap edges by node timing", () => {
    const current = graphNode("current", { start: 0, end: 60 });
    const overlapping = graphNode("overlapping", { start: 45, end: 90 });
    const later = graphNode("later", { start: 90, end: 120 });
    const endPoint = { id: "end", pathId: "main", x: 10, y: 180 };

    expect(isContinuousNode(current, overlapping)).toBe(true);
    expect(isContinuousNode(current, later)).toBe(false);
    expect(shouldDashGapEdge(current, later)).toBe(true);
    expect(shouldDashGapEdge(current, endPoint)).toBe(false);
  });

  it("finds the closest previous node that can connect by time", () => {
    const node = graphNode("target", { start: 150, end: 180, y: 150 });
    const tooLate = graphNode("too-late", { start: 140, end: 170, y: 120 });
    const earlier = graphNode("earlier", { start: 0, end: 80, y: 80 });
    const closest = graphNode("closest", { start: 90, end: 140, y: 120 });

    expect(findBestPreviousConnectableNode([tooLate, earlier, closest], node)).toBe(closest);
  });
});
