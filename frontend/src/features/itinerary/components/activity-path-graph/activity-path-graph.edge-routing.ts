import { isGraphNodePoint, isOverlappingNode } from "./activity-path-graph.edge-path";
import type { GraphEdge, GraphNode, GraphPoint, PushGraphEdge } from "./activity-path-graph.types";

export function createGraphEdgeCollector(): { edges: GraphEdge[]; pushEdge: PushGraphEdge } {
  const edges: GraphEdge[] = [];
  const edgeIds = new Set<string>();
  return {
    edges,
    pushEdge: (from, to, color, dashed = false) => {
      if (from.id === to.id) return;
      if (isGraphNodePoint(from) && isGraphNodePoint(to) && isOverlappingNode(from, to)) return;
      const id = `${from.id}->${to.id}${dashed ? ":dashed" : ""}`;
      if (edgeIds.has(id)) return;
      edgeIds.add(id);
      edges.push({ id, color, dashed, from, to });
    },
  };
}

export function isContinuousNode(current: GraphNode, next: GraphNode): boolean {
  if (current.end === null || next.start === null) return true;
  return next.start <= current.end;
}

export function shouldDashGapEdge(current: GraphNode, next: GraphPoint): boolean {
  if (!isGraphNodePoint(next) || current.end === null || next.start === null) return false;
  return next.start > current.end;
}

export function startsAfterNode(current: GraphNode, next: GraphNode): boolean {
  if (current.end === null || next.start === null) return true;
  return next.start >= current.end;
}

export function pathHasOverlappingEntry(pathNodes: GraphNode[], mainNode: GraphNode): boolean {
  return pathNodes.some((node) => node.y > mainNode.y && isOverlappingNode(mainNode, node));
}

export function hasIncomingEdge(edges: GraphEdge[], node: GraphNode): boolean {
  return edges.some((edge) => edge.to.id === node.id);
}

export function findBestPreviousConnectableNode(candidates: GraphNode[], node: GraphNode): GraphNode | undefined {
  return candidates
    .filter((candidate) => candidate.id !== node.id && candidate.y < node.y && canConnectByTime(candidate, node))
    .sort((left, right) => (right.end ?? right.start ?? 0) - (left.end ?? left.start ?? 0) || right.y - left.y)[0];
}

export function findNextPathNodeBeforeMain(pathNodes: GraphNode[], mainNode: GraphNode, nextMain: GraphNode | undefined): GraphNode | undefined {
  return pathNodes.find((node) => (
    node.y > mainNode.y &&
    (!nextMain || startsBeforeOrWithinNode(node, nextMain)) &&
    startsAfterNode(mainNode, node)
  ));
}

export function findNextMainNode(mainNodes: GraphNode[], current: GraphNode): GraphNode | undefined {
  const currentEnd = current.end ?? current.start ?? 0;
  return mainNodes.find((node) => node.y > current.y && (node.start === null || node.start >= currentEnd));
}

export function startsBeforeOrAtNode(current: GraphNode, next: GraphNode): boolean {
  if (current.start === null || next.start === null) return current.y < next.y;
  return current.start <= next.start;
}

function canConnectByTime(current: GraphNode, next: GraphNode): boolean {
  if (current.end === null || next.start === null) return true;
  return current.end <= next.start;
}

function startsBeforeOrWithinNode(current: GraphNode, next: GraphNode): boolean {
  if (current.start === null || next.start === null) return current.y < next.y;
  return current.start <= next.start || isOverlappingNode(next, current);
}
