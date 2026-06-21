import { tripFixture } from "../trip-fixtures";

export function overlappingActivityItems() {
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

  return { mainItem, middleItem, lateItem };
}
