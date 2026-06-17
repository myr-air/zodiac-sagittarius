import { useEffect, useState, type RefObject } from "react";
import type { GraphLayout } from "./activity-path-graph.types";
import type { ItineraryItem } from "@/src/trip/types";
import { addStopRowHeight, dayRowHeight, rowStep } from "./activity-path-graph.styles";

const roundPathNumber = (value: number): number => Math.round(value * 100) / 100;
const isUsableRect = (rect: DOMRect): boolean =>
  Number.isFinite(rect.top) && Number.isFinite(rect.height) && rect.height > 0;

export function useRenderedGraphLayout(
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

export function buildFallbackGraphLayout(rowItems: ItineraryItem[]): GraphLayout {
  const height = Math.max(dayRowHeight + addStopRowHeight, dayRowHeight + rowItems.length * rowStep + addStopRowHeight);
  return {
    endY: dayRowHeight + rowItems.length * rowStep + addStopRowHeight / 2,
    height,
    itemYById: new Map(rowItems.map((item, index) => [item.id, dayRowHeight + rowStep / 2 + index * rowStep])),
    startY: dayRowHeight / 2,
  };
}

export function measureRenderedGraphLayout(
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

export function collectGraphMeasurementElements(graphElement: HTMLDivElement, day: string, rowItems: ItineraryItem[]): HTMLElement[] {
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

function areGraphLayoutsEqual(left: GraphLayout | null, right: GraphLayout | null): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  if (left.height !== right.height || left.startY !== right.startY || left.endY !== right.endY || left.itemYById.size !== right.itemYById.size) return false;
  for (const [itemId, leftY] of left.itemYById) {
    if (right.itemYById.get(itemId) !== leftY) return false;
  }
  return true;
}
