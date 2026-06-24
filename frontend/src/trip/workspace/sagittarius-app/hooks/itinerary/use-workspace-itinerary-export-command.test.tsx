import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import { useWorkspaceItineraryExportCommand } from "./use-workspace-itinerary-export-command";

describe("useWorkspaceItineraryExportCommand", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads an itinerary export JSON document with related records", async () => {
    const click = vi.fn();
    const remove = vi.fn();
    const anchor = {
      click,
      remove,
      set href(value: string) {
        this.hrefValue = value;
      },
      get href() {
        return this.hrefValue;
      },
      download: "",
      hrefValue: "",
    };
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "a") return anchor as unknown as HTMLAnchorElement;
      return originalCreateElement(tagName);
    });
    const append = vi.spyOn(document.body, "append").mockImplementation(vi.fn());
    const createObjectURL = vi.fn().mockReturnValue("blob:itinerary-export");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });

    const { result } = renderHook(() =>
      useWorkspaceItineraryExportCommand({
        planItems: tripFixture.planItems,
        stopNotes: tripFixture.stopNotes,
        tasks: tripFixture.tasks,
        trip: tripFixture.trip,
      }),
    );

    act(() => {
      result.current();
    });

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    const exportedBlob = createObjectURL.mock.calls[0]?.[0] as Blob;
    const exportedDocument = JSON.parse(await exportedBlob.text());
    expect(exportedDocument.items).toHaveLength(tripFixture.planItems.length);
    expect(exportedDocument.records.stopNotes).toHaveLength(tripFixture.stopNotes.length);
    expect(exportedDocument.records.tasks).toHaveLength(tripFixture.tasks.length);
    expect(anchor.href).toBe("blob:itinerary-export");
    expect(anchor.download).toBe("hong-kong-shenzhen-trip-itinerary-v1.json");
    expect(append).toHaveBeenCalledWith(anchor);
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:itinerary-export");
  });
});
