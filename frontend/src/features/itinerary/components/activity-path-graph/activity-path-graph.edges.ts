import { mainItineraryPathId } from "@/src/trip/itinerary";
import { laneColors } from "./activity-path-graph.styles";
import { isOverlappingNode } from "./activity-path-graph.edge-path";
import {
  createGraphEdgeCollector,
  findBestPreviousConnectableNode,
  findNextMainNode,
  findNextPathNodeBeforeMain,
  hasIncomingEdge,
  isContinuousNode,
  pathHasOverlappingEntry,
  shouldDashGapEdge,
  startsBeforeOrAtNode,
} from "./activity-path-graph.edge-routing";
import type { GraphEdge, GraphNode, GraphPoint, PushGraphEdge } from "./activity-path-graph.types";

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
