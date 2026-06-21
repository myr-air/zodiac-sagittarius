import { describe, expect, it, vi } from "vitest";
import { buildFallbackGraphLayout, collectGraphMeasurementElements, measureRenderedGraphLayout } from "../activity-path-graph.layout";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import { mainItineraryPathId } from "@/src/trip/itinerary";
import type { ItineraryItem } from "@/src/trip/types";

function makeRect(left: number, top: number, width = 100, height = 40): DOMRect {
  return {
    top,
    right: left + width,
    bottom: top + height,
    left,
    width,
    height,
    x: left,
    y: top,
    toJSON() {
      return {};
    },
  } as DOMRect;
}

const item: ItineraryItem = {
  ...buildItineraryItem({
    id: "item-a",
    activity: "Activity A",
    place: "Location",
    pathGroupId: "group-a",
    pathId: "path-a",
  }),
};
const duplicateItem: ItineraryItem = buildItineraryItem({
  id: "item-b",
  pathGroupId: "group-b",
});

function mockRect(target: Element, rect: DOMRect) {
  vi.spyOn(target, "getBoundingClientRect").mockReturnValue(rect);
}

describe("activity-path-graph.layout", () => {
  it("builds fallback layout using row-step geometry", () => {
    const layout = buildFallbackGraphLayout([item, duplicateItem]);
    expect(layout.startY).toBe(23.75);
    expect(layout.endY).toBe(183.5);
    expect(layout.height).toBe(201.5);
    expect(layout.itemYById.get("item-a")).toBe(77);
  });

  it("collects all relevant measurement elements", () => {
    document.body.innerHTML = `
      <table>
        <tbody>
          <tr>
            <td><div data-graph></div></td>
          </tr>
          <tr data-item-id="item-a"><td>item-a</td></tr>
          <tr data-day-drop="2026-06-19"><td>add</td></tr>
        </tbody>
      </table>
    `;
    const graphElement = document.querySelector("[data-graph]") as HTMLDivElement;
    const elements = collectGraphMeasurementElements(graphElement, "2026-06-19", [item]);
    expect(elements).toHaveLength(4);
    expect(elements.map((element) => element.getAttribute("data-item-id") ?? element.getAttribute("data-day-drop") ?? element.tagName.toLowerCase()))
      .toContain("item-a");
    expect(elements.some((element) => element.getAttribute("data-day-drop") === "2026-06-19")).toBe(true);
    expect(elements[0]?.tagName.toLowerCase()).toBe("div");
  });

  it("measures rendered layout from DOM geometry", () => {
    document.body.innerHTML = `
      <table>
        <tbody>
          <tr>
            <td>day</td>
            <td><div data-graph></div></td>
          </tr>
          <tr data-item-id="item-a"><td>item-a</td></tr>
          <tr data-day-drop="2026-06-19"><td>add</td></tr>
        </tbody>
      </table>
    `;
    const graphElement = document.querySelector("[data-graph]") as HTMLDivElement;
    const fallbackLayout = buildFallbackGraphLayout([item]);
    const graphRow = graphElement.closest("tr") as HTMLTableRowElement;
    const itemRow = document.querySelector('[data-item-id="item-a"]') as HTMLTableRowElement;
    const addStopRow = document.querySelector('[data-day-drop="2026-06-19"]') as HTMLTableRowElement;
    const tbody = graphRow.parentElement as HTMLTableSectionElement;

    mockRect(graphElement, makeRect(0, 0));
    mockRect(graphRow, makeRect(0, 120, 200, 60));
    mockRect(itemRow, makeRect(0, 300, 200, 40));
    mockRect(addStopRow, makeRect(0, 420, 200, 30));

    const layout = measureRenderedGraphLayout(graphElement, "2026-06-19", [item], fallbackLayout);

    expect(layout).toEqual({
      endY: 435,
      height: 450,
      itemYById: new Map([[item.id, 320]]),
      startY: 150,
    });
    expect(layout?.itemYById.get(item.id)).toBe(320);
    expect(layout?.startY).toBe(150);
    expect(layout?.endY).toBe(435);
    expect(tbody).toBeTruthy();
    expect(mainItineraryPathId).toBe("main");
  });
});
