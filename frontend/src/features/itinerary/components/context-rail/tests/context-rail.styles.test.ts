import { describe, expect, it } from "vitest";
import {
  bookingDocClassName,
  bookingTaskClassName,
  contextRailSurfaceItemClassName,
  expenseItemClassName,
  noteItemClassName,
} from "../context-rail.styles";

describe("context rail styles", () => {
  it("keeps compact item surfaces on one local shell", () => {
    expect(contextRailSurfaceItemClassName).toContain("rounded-(--radius-sm)");
    expect(contextRailSurfaceItemClassName).toContain("border-(--color-border)");
    expect(contextRailSurfaceItemClassName).toContain("bg-(--color-surface-subtle)");
    expect(contextRailSurfaceItemClassName).toContain("px-2.5");

    expect(noteItemClassName).toContain(contextRailSurfaceItemClassName);
    expect(bookingTaskClassName).toContain(contextRailSurfaceItemClassName);
    expect(bookingDocClassName).toContain(contextRailSurfaceItemClassName);
    expect(expenseItemClassName).toContain(contextRailSurfaceItemClassName);
  });

  it("keeps item-specific layout and spacing outside the shared shell", () => {
    expect(noteItemClassName).toContain("stop-note-item");
    expect(noteItemClassName).toContain("py-[9px]");
    expect(bookingTaskClassName).toContain("grid-cols-[minmax(0,1fr)_auto]");
    expect(bookingDocClassName).toContain("text-xs");
    expect(expenseItemClassName).toContain("py-2");
  });
});
