import { parseTime, mainItineraryPathId, itineraryPathOptionsForDay, type ItineraryPathOption } from "@/src/trip/itinerary";
import {
  humanizePathId,
  itineraryItemPathId,
  mainItineraryPathName,
} from "@/src/trip/itinerary-path-identifiers";
import type { ItineraryItem } from "@/src/trip/types";
import { dotLaneGap, laneColors, rowStep } from "./activity-path-graph.styles";
import type { GraphEdge, GraphNode, GraphPoint, PushGraphEdge } from "./activity-path-graph.types";

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

export function buildGraphEdges(nodes: GraphNode[], graphWidth: number, startY: number, endY: number): GraphEdge[] {
  const startPoint: GraphPoint = { id: "start", pathId: mainItineraryPathId, x: graphWidth / 2, y: startY };
  const endPoint: GraphPoint = { id: "end", pathId: mainItineraryPathId, x: graphWidth / 2, y: endY };
  const mainNodes = nodes.filter((node) => node.pathId === mainItineraryPathId);
  const { edges, pushEdge } = createGraphEdgeCollector();

  if (nodes.length === 0) {
    pushEdge(startPoint, endPoint, laneColors[0]);
    return edges;
  }

  const firstMain = mainNodes[0] ?? nodes[0];
  const nodesByPathId = groupAlternativeNodesByPath(nodes);
  addStartBranchEdges(pushEdge, startPoint, firstMain, nodes);
  addMainTimelineEdges(pushEdge, mainNodes);
  addMainToUnstartedPathEdges(pushEdge, mainNodes, nodesByPathId);
  addPathContinuationAndReturnEdges(pushEdge, nodesByPathId, mainNodes, endPoint);
  addFloatingNodeEntryEdges(pushEdge, edges, nodes, nodesByPathId, mainNodes);
  addEndEdges(pushEdge, mainNodes, nodesByPathId, endPoint);

  return edges;
}

export function buildEdgePath(edge: GraphEdge): string {
  const directionY = edge.to.y >= edge.from.y ? 1 : -1;
  const isAnchorEdge = edge.from.id === "start" || edge.to.id === "end";

  if (edge.from.pathId === edge.to.pathId && !isAnchorEdge) {
    return `M ${roundPathNumber(edge.from.x)} ${roundPathNumber(edge.from.y)} L ${roundPathNumber(edge.to.x)} ${roundPathNumber(edge.to.y)}`;
  }

  const directionX = edge.to.x >= edge.from.x ? 1 : -1;
  const verticalGap = Math.abs(edge.to.y - edge.from.y);
  const turnOffset = Math.min(rowStep / 2, Math.max(8, verticalGap / 2));
  const edgeY = edge.from.id === "start" ? edge.from.y + directionY * turnOffset : edge.to.id === "end" ? edge.to.y - directionY * turnOffset : edge.from.y + directionY * turnOffset;
  const cornerRadius = Math.max(
    4,
    Math.min(16, Math.abs(edge.to.x - edge.from.x) * 0.75, Math.abs(edgeY - edge.from.y), Math.abs(edge.to.y - edgeY)),
  );

  return [
    `M ${roundPathNumber(edge.from.x)} ${roundPathNumber(edge.from.y)}`,
    `L ${roundPathNumber(edge.from.x)} ${roundPathNumber(edgeY - directionY * cornerRadius)}`,
    `C ${roundPathNumber(edge.from.x)} ${roundPathNumber(edgeY)}, ${roundPathNumber(edge.from.x)} ${roundPathNumber(edgeY)}, ${roundPathNumber(edge.from.x + directionX * cornerRadius)} ${roundPathNumber(edgeY)}`,
    `L ${roundPathNumber(edge.to.x)} ${roundPathNumber(edgeY)}`,
    `L ${roundPathNumber(edge.to.x)} ${roundPathNumber(edge.to.y)}`,
  ].join(" ");
}

function createGraphEdgeCollector(): { edges: GraphEdge[]; pushEdge: PushGraphEdge } {
  const edges: GraphEdge[] = [];
  const edgeIds = new Set<string>();
  return {
    edges,
    pushEdge: (from, to, color, dashed = false) => {
      if (from.id === to.id) return;
      if (isGraphNode(from) && isGraphNode(to) && isOverlappingNode(from, to)) return;
      const id = `${from.id}->${to.id}${dashed ? ":dashed" : ""}`;
      if (edgeIds.has(id)) return;
      edgeIds.add(id);
      edges.push({ id, color, dashed, from, to });
    },
  };
}

function groupAlternativeNodesByPath(nodes: GraphNode[]): Map<string, GraphNode[]> {
  const nodesByPathId = new Map<string, GraphNode[]>();
  for (const node of nodes) {
    if (node.pathId === mainItineraryPathId) continue;
    nodesByPathId.set(node.pathId, [...(nodesByPathId.get(node.pathId) ?? []), node]);
  }
  return nodesByPathId;
}

function addStartBranchEdges(pushEdge: PushGraphEdge, startPoint: GraphPoint, firstMain: GraphNode, nodes: GraphNode[]): void {
  pushEdge(startPoint, firstMain, firstMain.color);
  for (const node of nodes) {
    if (node.id === firstMain.id) continue;
    if (isOverlappingNode(firstMain, node)) pushEdge(startPoint, node, node.color);
  }
}

function addMainTimelineEdges(pushEdge: PushGraphEdge, mainNodes: GraphNode[]): void {
  for (let index = 0; index < mainNodes.length - 1; index += 1) {
    const current = mainNodes[index];
    const next = mainNodes[index + 1];
    pushEdge(current, next, current.color, !isContinuousNode(current, next));
  }
}

function addMainToUnstartedPathEdges(
  pushEdge: PushGraphEdge,
  mainNodes: GraphNode[],
  nodesByPathId: Map<string, GraphNode[]>,
): void {
  for (let index = 0; index < mainNodes.length; index += 1) {
    const current = mainNodes[index];
    const nextMain = mainNodes[index + 1];
    for (const pathNodes of nodesByPathId.values()) {
      if (pathHasOverlappingEntry(pathNodes, current)) continue;
      const nextPlanNode = findNextPathNodeBeforeMain(pathNodes, current, nextMain);
      if (nextPlanNode) pushEdge(current, nextPlanNode, nextPlanNode.color, !isContinuousNode(current, nextPlanNode));
    }
  }
}

function addPathContinuationAndReturnEdges(
  pushEdge: PushGraphEdge,
  nodesByPathId: Map<string, GraphNode[]>,
  mainNodes: GraphNode[],
  endPoint: GraphPoint,
): void {
  for (const pathNodes of nodesByPathId.values()) {
    for (let index = 0; index < pathNodes.length - 1; index += 1) {
      const current = pathNodes[index];
      const nextPathNode = pathNodes[index + 1];
      const nextMain = findNextMainNode(mainNodes, current);
      if (nextMain && startsBeforeOrAtNode(nextMain, nextPathNode)) {
        pushEdge(current, nextMain, current.color, shouldDashGapEdge(current, nextMain));
        continue;
      }
      pushEdge(current, nextPathNode, current.color, !isContinuousNode(current, nextPathNode));
    }
    const last = pathNodes[pathNodes.length - 1];
    if (!last) continue;
    const target = findNextMainNode(mainNodes, last) ?? endPoint;
    pushEdge(last, target, last.color, shouldDashGapEdge(last, target));
  }
}

function addFloatingNodeEntryEdges(
  pushEdge: PushGraphEdge,
  edges: GraphEdge[],
  nodes: GraphNode[],
  nodesByPathId: Map<string, GraphNode[]>,
  mainNodes: GraphNode[],
): void {
  for (const node of nodes) {
    if (hasIncomingEdge(edges, node)) continue;
    const samePathNodes = node.pathId === mainItineraryPathId ? [] : nodesByPathId.get(node.pathId) ?? [];
    const previousNode = findBestPreviousConnectableNode([...samePathNodes, ...mainNodes], node);
    if (previousNode) pushEdge(previousNode, node, node.color, !isContinuousNode(previousNode, node));
  }
}

function addEndEdges(
  pushEdge: PushGraphEdge,
  mainNodes: GraphNode[],
  nodesByPathId: Map<string, GraphNode[]>,
  endPoint: GraphPoint,
): void {
  if (mainNodes.length > 0) {
    pushEdge(mainNodes[mainNodes.length - 1], endPoint, mainNodes[mainNodes.length - 1].color);
    return;
  }
  for (const pathNodes of nodesByPathId.values()) {
    const last = pathNodes[pathNodes.length - 1];
    if (last) pushEdge(last, endPoint, last.color);
  }
}

function itemInterval(item: ItineraryItem): { start: number; end: number } | null {
  const start = parseTime(item.startTime);
  if (start === null) return null;
  return { start, end: start + (item.durationMinutes ?? 45) };
}

function isContinuousNode(current: GraphNode, next: GraphNode): boolean {
  if (current.end === null || next.start === null) return true;
  return next.start <= current.end;
}

function shouldDashGapEdge(current: GraphNode, next: GraphPoint): boolean {
  if (!isGraphNode(next) || current.end === null || next.start === null) return false;
  return next.start > current.end;
}

function isGraphNode(point: GraphPoint): point is GraphNode {
  return "start" in point;
}

function isOverlappingNode(left: GraphNode, right: GraphNode): boolean {
  if (left.start === null || left.end === null || right.start === null || right.end === null) return false;
  return left.start < right.end && right.start < left.end;
}

function startsAfterNode(current: GraphNode, next: GraphNode): boolean {
  if (current.end === null || next.start === null) return true;
  return next.start >= current.end;
}

function pathHasOverlappingEntry(pathNodes: GraphNode[], mainNode: GraphNode): boolean {
  return pathNodes.some((node) => node.y > mainNode.y && isOverlappingNode(mainNode, node));
}

function hasIncomingEdge(edges: GraphEdge[], node: GraphNode): boolean {
  return edges.some((edge) => edge.to.id === node.id);
}

function findBestPreviousConnectableNode(candidates: GraphNode[], node: GraphNode): GraphNode | undefined {
  return candidates
    .filter((candidate) => candidate.id !== node.id && candidate.y < node.y && canConnectByTime(candidate, node))
    .sort((left, right) => (right.end ?? right.start ?? 0) - (left.end ?? left.start ?? 0) || right.y - left.y)[0];
}

function canConnectByTime(current: GraphNode, next: GraphNode): boolean {
  if (current.end === null || next.start === null) return true;
  return current.end <= next.start;
}

function findNextPathNodeBeforeMain(pathNodes: GraphNode[], mainNode: GraphNode, nextMain: GraphNode | undefined): GraphNode | undefined {
  return pathNodes.find((node) => (
    node.y > mainNode.y &&
    (!nextMain || startsBeforeOrWithinNode(node, nextMain)) &&
    startsAfterNode(mainNode, node)
  ));
}

function findNextMainNode(mainNodes: GraphNode[], current: GraphNode): GraphNode | undefined {
  const currentEnd = current.end ?? current.start ?? 0;
  return mainNodes.find((node) => node.y > current.y && (node.start === null || node.start >= currentEnd));
}

function startsBeforeOrAtNode(current: GraphNode, next: GraphNode): boolean {
  if (current.start === null || next.start === null) return current.y < next.y;
  return current.start <= next.start;
}

function startsBeforeOrWithinNode(current: GraphNode, next: GraphNode): boolean {
  if (current.start === null || next.start === null) return current.y < next.y;
  return current.start <= next.start || isOverlappingNode(next, current);
}

function roundPathNumber(value: number): number {
  return Math.round(value * 100) / 100;
}
