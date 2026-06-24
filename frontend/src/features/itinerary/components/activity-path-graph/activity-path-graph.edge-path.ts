import { rowStep } from "./activity-path-graph.styles";
import type { GraphEdge, GraphNode, GraphPoint } from "./activity-path-graph.types";

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

function roundPathNumber(value: number): number {
  return Math.round(value * 100) / 100;
}

function isGraphNode(point: GraphPoint): point is GraphNode {
  return "start" in point;
}

export function isOverlappingNode(left: GraphNode, right: GraphNode): boolean {
  if (left.start === null || left.end === null || right.start === null || right.end === null) return false;
  return left.start < right.end && right.start < left.end;
}

export function isGraphNodePoint(point: GraphPoint): point is GraphNode {
  return isGraphNode(point);
}
