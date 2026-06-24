import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

export function queryItineraryItemRow(itemId: string): HTMLTableRowElement | null {
  return document.querySelector<HTMLTableRowElement>(`[data-item-id="${itemId}"]`);
}

export function getItineraryItemRow(itemId: string): HTMLTableRowElement {
  const row = queryItineraryItemRow(itemId);
  if (!row) throw new Error(`Itinerary row not found: ${itemId}`);
  return row;
}

export function querySubItineraryItemLine(itemId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-sub-item-id="${itemId}"]`);
}

export function getSubItineraryItemLine(itemId: string): HTMLElement {
  const line = querySubItineraryItemLine(itemId);
  if (!line) throw new Error(`Sub-itinerary line not found: ${itemId}`);
  return line;
}

export function findGraphLine(from: HTMLElement, to: HTMLElement): Element | undefined {
  const fromCenter = {
    x: Number.parseFloat(from.style.left),
    y: Number.parseFloat(from.style.top) + 18,
  };
  const toCenter = {
    x: Number.parseFloat(to.style.left),
    y: Number.parseFloat(to.style.top) + 18,
  };

  return Array.from(document.querySelectorAll(".activity-path-graph-line")).find(
    (line) =>
      line.getAttribute("data-from-x") === `${fromCenter.x}` &&
      line.getAttribute("data-from-y") === `${fromCenter.y}` &&
      line.getAttribute("data-to-x") === `${toCenter.x}` &&
      line.getAttribute("data-to-y") === `${toCenter.y}`,
  );
}

export function layoutRect(top: number, height: number, width = 120): DOMRect {
  return {
    bottom: top + height,
    height,
    left: 0,
    right: width,
    top,
    width,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

export function createDragDataTransfer() {
  const store = new Map<string, string>();
  return {
    dropEffect: "move",
    effectAllowed: "move",
    getData: vi.fn((type: string) => store.get(type) ?? ""),
    setData: vi.fn((type: string, value: string) => {
      store.set(type, value);
    }),
  };
}

export async function openHeaderControls(user: ReturnType<typeof userEvent.setup>) {
  const controlsButton = screen.getByRole("button", { name: "Trip Plan controls" });
  await user.click(controlsButton);
  return controlsButton;
}

export { waitFor };
