import { describe, expect, it } from "vitest";
import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import {
  buildItineraryItem,
  mainPathOption,
} from "@/src/features/itinerary/testing";
import {
  dedupePathOptions,
  formatSelectedPlanLabel,
} from "../smart-itinerary-table-utils";

const countLabel = ({ count }: { count: number }) => `${count} selected`;
const namesLabel = ({ names }: { names: string }) => `Selected: ${names}`;

describe("smart itinerary table path labels", () => {
  it("deduplicates path options and formats labels consistently", () => {
    const pathOptions: ItineraryPathOption[] = [
      mainPathOption,
      { id: "p2", name: "Plan 2", scope: "trip" } as ItineraryPathOption,
    ];
    const items = [
      buildItineraryItem({
        id: "i1",
        pathId: "p2",
        pathName: "Plan 2",
        pathRole: "alternative",
        day: "2026-06-10",
        sortOrder: 0,
        startTime: "09:00",
        endTime: null,
        activity: "a",
      }),
      buildItineraryItem({
        id: "i2",
        pathId: "p3",
        pathName: "Custom",
        pathRole: "alternative",
        day: "2026-06-11",
        sortOrder: 0,
        startTime: "09:00",
        endTime: null,
        activity: "b",
      }),
    ];
    const options = dedupePathOptions(pathOptions, items);
    expect(options).toEqual([
      { id: "main", name: "Main" },
      { id: "p2", name: "Plan 2" },
      { id: "p3", name: "Custom" },
    ]);
    expect(
      formatSelectedPlanLabel(
        options,
        ["main", "p3"],
        countLabel,
        namesLabel,
      ),
    ).toBe("Selected: Main, Custom");
  });
});
