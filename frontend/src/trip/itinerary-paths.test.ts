import { describe, expect, it } from "vitest";
import { tripFixture } from "./trip-fixtures";
import { applyItemToActivityBranch, applyManualActivityPath, deriveManualActivityPathOptions } from "./itinerary-paths";
import {
  pathIdPlanA,
  pathIdPlanB,
  pathNamePlanA,
  pathNamePlanB,
} from "./testing/itinerary-path-fixtures";

describe("itinerary path import application", () => {
  it("keeps overlapping created activities on main until an organizer explicitly chooses an alternative path", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "item-main-long",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 225,
      sortOrder: 100,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const middleItem = {
      ...tripFixture.planItems[1],
      id: "item-middle",
      day: "2026-06-19",
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const lateItem = {
      ...middleItem,
      id: "item-late",
      startTime: "09:00",
      durationMinutes: 45,
      sortOrder: 300,
    };
    const trip = {
      ...tripFixture.trip,
      itineraryItems: [mainItem],
    };

    const withMiddle = applyItemToActivityBranch(trip, middleItem).trip;
    const withLate = applyItemToActivityBranch(withMiddle, lateItem).trip;
    const itemsById = new Map(withLate.itineraryItems.map((item) => [item.id, item]));

    expect(itemsById.get("item-main-long")).toMatchObject({ pathRole: undefined });
    expect(itemsById.get("item-main-long")?.pathGroupId).toBeUndefined();
    expect(itemsById.get("item-middle")).toMatchObject({ pathRole: "main" });
    expect(itemsById.get("item-middle")?.pathGroupId).toBeUndefined();
    expect(itemsById.get("item-late")).toMatchObject({ pathRole: "main" });
    expect(itemsById.get("item-late")?.pathGroupId).toBeUndefined();
  });

  it("lets organizers explicitly assign overlapping activities to plan A or B", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "item-main-long",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 225,
      sortOrder: 100,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const middleItem = {
      ...tripFixture.planItems[1],
      id: "item-middle",
      day: "2026-06-19",
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const lateItem = {
      ...middleItem,
      id: "item-late",
      startTime: "09:00",
      durationMinutes: 45,
      sortOrder: 300,
    };
    const flatTrip = applyItemToActivityBranch(
      applyItemToActivityBranch({ ...tripFixture.trip, itineraryItems: [mainItem] }, middleItem).trip,
      lateItem,
    ).trip;

    const planATrip = applyManualActivityPath(flatTrip, "item-late", pathIdPlanA).trip;
    const planBTrip = applyManualActivityPath(planATrip, "item-main-long", pathIdPlanB).trip;
    const itemsById = new Map(planBTrip.itineraryItems.map((item) => [item.id, item]));

    expect(itemsById.get("item-middle")).toMatchObject({
      pathGroupId: "path-group-item-main-long",
      pathRole: "main",
    });
    expect(itemsById.get("item-late")).toMatchObject({
      pathGroupId: "path-group-item-main-long",
      pathId: pathIdPlanA,
      pathName: pathNamePlanA,
      pathRole: "alternative",
    });
    expect(itemsById.get("item-main-long")).toMatchObject({
      pathGroupId: "path-group-item-main-long",
      pathId: pathIdPlanB,
      pathName: pathNamePlanB,
      pathRole: "alternative",
    });
  });

  it("promotes another branch item when the current main activity is moved into an empty plan", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "item-main-long",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 225,
      sortOrder: 100,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const middleItem = {
      ...tripFixture.planItems[1],
      id: "item-middle",
      day: "2026-06-19",
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const flatTrip = applyItemToActivityBranch({ ...tripFixture.trip, itineraryItems: [mainItem] }, middleItem).trip;

    const next = applyManualActivityPath(flatTrip, "item-main-long", pathIdPlanB).trip;
    const itemsById = new Map(next.itineraryItems.map((item) => [item.id, item]));

    expect(itemsById.get("item-main-long")).toMatchObject({
      pathId: pathIdPlanB,
      pathName: pathNamePlanB,
      pathRole: "alternative",
    });
    expect(itemsById.get("item-middle")).toMatchObject({
      pathGroupId: "path-group-item-main-long",
      pathRole: "main",
    });
  });

  it("moves sub-activities with their parent activity block when assigning an explicit path", () => {
    const block = {
      ...tripFixture.planItems[0],
      id: "item-flight-block",
      day: "2026-06-19",
      startTime: "04:00",
      durationMinutes: 540,
      sortOrder: 100,
      isPlanBlock: true,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const child = {
      ...tripFixture.planItems[1],
      id: "item-flight-checkin",
      parentItemId: "item-flight-block",
      day: "2026-06-19",
      startTime: "06:00",
      durationMinutes: 60,
      sortOrder: 200,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const overlap = {
      ...tripFixture.planItems[2],
      id: "item-hotel-breakfast",
      day: "2026-06-19",
      startTime: "06:30",
      durationMinutes: 45,
      sortOrder: 300,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const trip = {
      ...tripFixture.trip,
      itineraryItems: [block, child, overlap],
    };

    const placement = applyManualActivityPath(trip, "item-flight-block", pathIdPlanA);
    const itemsById = new Map(placement.trip.itineraryItems.map((item) => [item.id, item]));

    expect(itemsById.get("item-flight-block")).toMatchObject({
      pathGroupId: "path-group-item-flight-block",
      pathId: pathIdPlanA,
      pathName: pathNamePlanA,
      pathRole: "alternative",
    });
    expect(itemsById.get("item-flight-checkin")).toMatchObject({
      pathGroupId: "path-group-item-flight-block",
      pathId: pathIdPlanA,
      pathName: pathNamePlanA,
      pathRole: "alternative",
    });
    expect(placement.changedExistingItems.map((item) => item.id)).toEqual([
      "item-flight-block",
      "item-flight-checkin",
      "item-hotel-breakfast",
    ]);
  });

  it("exposes manual path choices for an overlapping activity branch", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "item-main-long",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 225,
      sortOrder: 100,
    };
    const middleItem = {
      ...tripFixture.planItems[1],
      id: "item-middle",
      day: "2026-06-19",
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
    };
    const trip = applyItemToActivityBranch({ ...tripFixture.trip, itineraryItems: [mainItem] }, middleItem).trip;

    expect(deriveManualActivityPathOptions(trip, "item-middle")).toEqual([
      { id: "main", name: "Main" },
      { id: pathIdPlanA, name: pathNamePlanA },
      { id: pathIdPlanB, name: pathNamePlanB },
    ]);
  });

  it("keeps non-overlapping created activities on the main path", () => {
    const trip = {
      ...tripFixture.trip,
      itineraryItems: [{
        ...tripFixture.planItems[0],
        id: "item-main",
        day: "2026-06-19",
        startTime: "08:00",
        durationMinutes: 45,
        sortOrder: 100,
      }],
    };
    const nextItem = {
      ...tripFixture.planItems[1],
      id: "item-later",
      day: "2026-06-19",
      startTime: "10:00",
      durationMinutes: 45,
      sortOrder: 200,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };

    const next = applyItemToActivityBranch(trip, nextItem).trip;

    expect(next.itineraryItems.find((item) => item.id === "item-later")).toMatchObject({
      pathRole: "main",
    });
    expect(next.itineraryItems.find((item) => item.id === "item-later")?.pathGroupId).toBeUndefined();
  });


});
