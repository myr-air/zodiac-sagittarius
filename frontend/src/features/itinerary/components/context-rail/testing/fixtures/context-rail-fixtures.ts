import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";

export const selectedContextRailItem =
  tripFixture.planItems.find((item) => item.id === "item-dimdim") ??
  tripFixture.planItems[0];
