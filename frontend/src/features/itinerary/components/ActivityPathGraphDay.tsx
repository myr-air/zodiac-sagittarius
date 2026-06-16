import { cn } from "@/src/lib/cn";
import { mainItineraryPathId, parseTime, type ItineraryPathOption } from "@/src/trip/itinerary";
import { humanizePathId, itineraryItemPathId } from "@/src/trip/itinerary-path-identifiers";
import type { ItineraryItem } from "@/src/trip/types";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { Select } from "@/src/ui";

interface ActivityPathGraphDayProps {
  canEdit: boolean;
  day: string;
  dayLabel: string;
  graphWidth: number;
  graphItems: ItineraryItem[];
  pathOptions: ItineraryPathOption[];
  rowItems: ItineraryItem[];
  selectedItemId: string;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onSelectItem: (itemId: string) => void;
}

const graphClassName = "activity-path-graph relative w-full bg-(--color-surface-subtle)";
const dotClassName =
  "activity-path-graph-node absolute z-[3] left-1/2 size-9 -translate-x-1/2 rounded-full border-0 bg-transparent p-0 transition-transform hover:scale-105 focus-visible:outline-none before:absolute before:left-1/2 before:top-1/2 before:size-3 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:border-2 before:border-(--color-surface) before:bg-(--activity-path-node-color) before:shadow-[0_1px_4px_rgb(15_23_42_/_0.18)] after:absolute after:left-1/2 after:top-1/2 after:size-4 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:opacity-0 after:ring-2 after:ring-(--color-primary-strong) after:ring-offset-1 after:ring-offset-(--color-surface)";
const selectedDotClassName = "activity-path-graph-node--selected after:opacity-100";
const pathSelectClassName = "sr-only";
const anchorClassName =
  "activity-path-graph-anchor absolute z-[3] left-1/2 size-3 -translate-x-1/2 rounded-full border-2 border-(--color-primary) bg-white shadow-[0_1px_4px_rgb(15_23_42_/_0.12)]";
const dotSize = 12;
const dotHitTargetSize = 36;
const dayRowHeight = 47.5;
const addStopRowHeight = 36;
const rowStep = 59;
const dotLaneGap = 18;
const laneColors = [
  "var(--color-primary)",
  "var(--color-route)",
  "var(--color-warning)",
  "var(--color-coral)",
  "var(--color-sky)",
  "#64748b",
];

export function ActivityPathGraphDay({
  canEdit,
  day,
  dayLabel,
  graphWidth,
  graphItems,
  pathOptions,
  rowItems,
  selectedItemId,
  onMoveItemToPath,
  onSelectItem,
}: ActivityPathGraphDayProps) {
  const graphRef = useRef<HTMLDivElement>(null);
  const pathMetaById = buildPathMeta(day, graphItems, pathOptions);
  const pathIds = buildVisibleLanePathIds(rowItems);
  const laneXByPathId = buildLaneXByPathId(pathIds, graphWidth);
  const fallbackLayout = useMemo(() => buildFallbackGraphLayout(rowItems), [rowItems]);
  const measuredLayout = useRenderedGraphLayout(graphRef, day, rowItems, fallbackLayout);
  const graphLayout = measuredLayout ?? fallbackLayout;
  const graphNodes = buildGraphNodes(rowItems, pathMetaById, laneXByPathId, graphWidth, graphLayout.itemYById);
  const graphEdges = buildGraphEdges(graphNodes, graphWidth, graphLayout.startY, graphLayout.endY);

  return (
    <div ref={graphRef} className={graphClassName} role="group" aria-label={`Activity path graph for ${dayLabel}`} style={{ height: fallbackLayout.height }}>
      <svg
        className="pointer-events-none absolute left-0 top-0 z-[1] w-full overflow-visible"
        viewBox={`0 0 ${graphWidth} ${graphLayout.height}`}
        aria-hidden="true"
        style={{ height: graphLayout.height }}
      >
        {graphEdges.map((edge) => (
          <path
            key={edge.id}
            className={cn("activity-path-graph-line", edge.dashed && "activity-path-graph-line--dashed")}
            d={buildEdgePath(edge)}
            data-from-x={edge.from.x}
            data-from-y={edge.from.y}
            data-to-x={edge.to.x}
            data-to-y={edge.to.y}
            fill="none"
            stroke={edge.color}
            strokeDasharray={edge.dashed ? "3 4" : undefined}
            strokeLinecap="round"
            strokeOpacity={0.5}
            strokeWidth={2}
          />
        ))}
      </svg>
      <span aria-label={`Start of ${dayLabel}`} className={anchorClassName} role="img" style={{ top: graphLayout.startY - dotSize / 2 }} />
      <span
        aria-label={`End of ${dayLabel}`}
        className={anchorClassName}
        role="img"
        style={{ top: graphLayout.endY - dotSize / 2 }}
      />
      {graphNodes.map(({ color, item, pathName, sourcePathId, x, y }) => {
        return (
          <span key={item.id}>
            <button
              aria-label={`${item.activity} on ${pathName}`}
              className={cn(dotClassName, selectedItemId === item.id && selectedDotClassName)}
              draggable={canEdit}
              style={{ "--activity-path-node-color": color, left: x, top: y - dotHitTargetSize / 2 } as CSSProperties}
              title={`${item.activity} (${pathName})`}
              type="button"
              onClick={() => onSelectItem(item.id)}
              onDragStart={(event) => {
                if (!canEdit) return;
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.id);
              }}
            />
            <Select
              aria-label={`Move ${item.activity} to path`}
              className={pathSelectClassName}
              disabled={!canEdit || !onMoveItemToPath}
              value={sourcePathId}
              onChange={(event) => onMoveItemToPath?.(item.id, event.target.value)}
            >
              {[...pathMetaById].map(([id, option]) => (
                <option key={id} value={id}>{option.name}</option>
              ))}
            </Select>
          </span>
        );
      })}
    </div>
  );
}

interface GraphPoint {
  id: string;
  pathId?: string;
  x: number;
  y: number;
}

interface GraphNode extends GraphPoint {
  color: string;
  end: number | null;
  item: ItineraryItem;
  pathId: string;
  pathName: string;
  sourcePathId: string;
  start: number | null;
}

interface GraphEdge {
  id: string;
  color: string;
  dashed?: boolean;
  from: GraphPoint;
  to: GraphPoint;
}

type PushGraphEdge = (from: GraphPoint, to: GraphPoint, color: string, dashed?: boolean) => void;

interface GraphLayout {
  endY: number;
  height: number;
  itemYById: Map<string, number>;
  startY: number;
}

function buildFallbackGraphLayout(rowItems: ItineraryItem[]): GraphLayout {
  const height = Math.max(dayRowHeight + addStopRowHeight, dayRowHeight + rowItems.length * rowStep + addStopRowHeight);
  return {
    endY: dayRowHeight + rowItems.length * rowStep + addStopRowHeight / 2,
    height,
    itemYById: new Map(rowItems.map((item, index) => [item.id, dayRowHeight + rowStep / 2 + index * rowStep])),
    startY: dayRowHeight / 2,
  };
}

function useRenderedGraphLayout(
  graphRef: RefObject<HTMLDivElement | null>,
  day: string,
  rowItems: ItineraryItem[],
  fallbackLayout: GraphLayout,
): GraphLayout | null {
  const [layout, setLayout] = useState<GraphLayout | null>(null);

  useEffect(() => {
    const graphElement = graphRef.current;
    const ownerWindow = graphElement?.ownerDocument.defaultView;
    if (!graphElement || !ownerWindow) {
      setLayout(null);
      return;
    }

    let animationFrame = 0;
    const updateLayout = () => {
      const nextLayout = measureRenderedGraphLayout(graphElement, day, rowItems, fallbackLayout);
      setLayout((currentLayout) => (areGraphLayoutsEqual(currentLayout, nextLayout) ? currentLayout : nextLayout));
    };
    const scheduleUpdate = () => {
      ownerWindow.cancelAnimationFrame(animationFrame);
      animationFrame = ownerWindow.requestAnimationFrame(updateLayout);
    };

    updateLayout();
    scheduleUpdate();
    ownerWindow.addEventListener("resize", scheduleUpdate);

    const resizeObserver = typeof ownerWindow.ResizeObserver === "function" ? new ownerWindow.ResizeObserver(scheduleUpdate) : null;
    if (resizeObserver) {
      for (const element of collectGraphMeasurementElements(graphElement, day, rowItems)) resizeObserver.observe(element);
    }

    return () => {
      ownerWindow.cancelAnimationFrame(animationFrame);
      ownerWindow.removeEventListener("resize", scheduleUpdate);
      resizeObserver?.disconnect();
    };
  }, [day, fallbackLayout, graphRef, rowItems]);

  return layout;
}

function measureRenderedGraphLayout(
  graphElement: HTMLDivElement,
  day: string,
  rowItems: ItineraryItem[],
  fallbackLayout: GraphLayout,
): GraphLayout | null {
  const tbody = graphElement.closest("tbody");
  const dayRow = graphElement.closest("tr");
  const addStopRow = findAddStopRow(tbody, day);
  if (!tbody || !dayRow || !addStopRow) return null;

  const graphRect = graphElement.getBoundingClientRect();
  const dayRect = dayRow.getBoundingClientRect();
  const addStopRect = addStopRow.getBoundingClientRect();
  if (!isUsableRect(dayRect) || !isUsableRect(addStopRect)) return null;

  const itemYById = new Map<string, number>();
  let measuredBottom = Math.max(dayRect.bottom, addStopRect.bottom);
  for (const item of rowItems) {
    const itemRow = findItemRow(tbody, item.id);
    if (!itemRow) return null;
    const itemRect = itemRow.getBoundingClientRect();
    if (!isUsableRect(itemRect)) return null;
    itemYById.set(item.id, rowCenterY(itemRect, graphRect));
    measuredBottom = Math.max(measuredBottom, itemRect.bottom);
  }

  return {
    endY: rowCenterY(addStopRect, graphRect),
    height: Math.max(fallbackLayout.height, roundPathNumber(measuredBottom - graphRect.top)),
    itemYById,
    startY: rowCenterY(dayRect, graphRect),
  };
}

function collectGraphMeasurementElements(graphElement: HTMLDivElement, day: string, rowItems: ItineraryItem[]): HTMLElement[] {
  const tbody = graphElement.closest("tbody");
  const elements = new Set<HTMLElement>([graphElement]);
  const dayRow = graphElement.closest<HTMLElement>("tr");
  const addStopRow = findAddStopRow(tbody, day);
  if (dayRow) elements.add(dayRow);
  if (addStopRow) elements.add(addStopRow);
  for (const item of rowItems) {
    const itemRow = findItemRow(tbody, item.id);
    if (itemRow) elements.add(itemRow);
  }
  return Array.from(elements);
}

function findAddStopRow(tbody: Element | null, day: string): HTMLElement | null {
  const addStopRow = tbody?.querySelector<HTMLElement>("[data-day-drop]");
  return addStopRow?.dataset.dayDrop === day ? addStopRow : null;
}

function findItemRow(tbody: Element | null, itemId: string): HTMLElement | null {
  return Array.from(tbody?.querySelectorAll<HTMLElement>("[data-item-id]") ?? []).find((row) => row.dataset.itemId === itemId) ?? null;
}

function rowCenterY(rowRect: DOMRect, graphRect: DOMRect): number {
  return roundPathNumber(rowRect.top - graphRect.top + rowRect.height / 2);
}

function isUsableRect(rect: DOMRect): boolean {
  return Number.isFinite(rect.top) && Number.isFinite(rect.height) && rect.height > 0;
}

function areGraphLayoutsEqual(left: GraphLayout | null, right: GraphLayout | null): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  if (left.height !== right.height || left.startY !== right.startY || left.endY !== right.endY || left.itemYById.size !== right.itemYById.size) return false;
  for (const [itemId, leftY] of left.itemYById) {
    if (right.itemYById.get(itemId) !== leftY) return false;
  }
  return true;
}

function buildLaneXByPathId(pathIds: string[], graphWidth: number): Map<string, number> {
  const laneCount = Math.max(1, pathIds.length);
  const firstLaneX = graphWidth / 2 - ((laneCount - 1) * dotLaneGap) / 2;
  return new Map(pathIds.map((pathId, index) => [pathId, firstLaneX + index * dotLaneGap]));
}

function buildVisibleLanePathIds(rowItems: ItineraryItem[]): string[] {
  const pathIds = new Set<string>([mainItineraryPathId]);
  rowItems.forEach((item) => pathIds.add(itineraryItemPathId(item)));
  return Array.from(pathIds);
}

function buildGraphNodes(
  rowItems: ItineraryItem[],
  pathMetaById: Map<string, { name: string; color: string }>,
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
      pathName: pathMeta?.name ?? "Main",
      sourcePathId: pathId,
      start: interval?.start ?? null,
      x: laneXByPathId.get(pathId) ?? graphWidth / 2,
      y: itemYById.get(item.id) ?? 0,
    };
  });
}

function buildGraphEdges(nodes: GraphNode[], graphWidth: number, startY: number, endY: number): GraphEdge[] {
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

function buildEdgePath(edge: GraphEdge): string {
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

function buildPathMeta(day: string, graphItems: ItineraryItem[], pathOptions: ItineraryPathOption[]): Map<string, { name: string; color: string }> {
  const options = new Map<string, string>([[mainItineraryPathId, "Main"]]);
  for (const option of pathOptions) {
    if (option.id === mainItineraryPathId || option.scope === "trip" || option.day === day) options.set(option.id, option.name);
  }
  for (const item of graphItems) {
    if (item.day !== day || item.pathRole !== "alternative" || !item.pathId) continue;
    options.set(item.pathId, item.pathName ?? humanizePathId(item.pathId));
  }
  return new Map(Array.from(options, ([id, name], index) => [id, { name, color: laneColors[index % laneColors.length] ?? laneColors[0] }]));
}

function itemInterval(item: ItineraryItem): { start: number; end: number } | null {
  const start = parseTime(item.startTime);
  if (start === null) return null;
  return { start, end: start + (item.durationMinutes ?? 45) };
}

 
