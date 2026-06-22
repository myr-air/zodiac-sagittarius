import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import {
  buildPrefixedPathScenarioItems,
  denseTripFixture,
  itineraryStoryDay,
  buildOverflowStoryItems,
} from "./support/itinerary-story-fixtures";

const templatePathScenarioItems = buildPrefixedPathScenarioItems("story");

export const branchGraphItems: ItineraryItem[] =
  templatePathScenarioItems.branchGraphItems;
export const planAExampleItems: ItineraryItem[] =
  templatePathScenarioItems.planAExampleItems;
export const planABAlternativeItems: ItineraryItem[] =
  templatePathScenarioItems.planABAlternativeItems;
export const requestedPlanExampleItems: ItineraryItem[] =
  templatePathScenarioItems.requestedPlanExampleItems;
export const stressPathItems: ItineraryItem[] =
  templatePathScenarioItems.stressPathItems;
export const denseTemplateItems = denseTripFixture.itineraryItems;

export const hierarchyBlockItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "story-flight-block",
    activity: "Flight to Hong Kong",
    activityType: "travel",
    itemKind: "travel",
    isPlanBlock: true,
    parentItemId: null,
    day: itineraryStoryDay,
    startTime: "04:00",
    endTime: "13:00",
    durationMinutes: 540,
    status: "confirmed",
    priority: "must",
    sortOrder: 100,
  },
  {
    ...tripFixture.planItems[1],
    id: "story-flight-checkin",
    activity: "Check in",
    activityType: "travel",
    itemKind: "preparation",
    parentItemId: "story-flight-block",
    day: itineraryStoryDay,
    startTime: "06:00",
    endTime: "06:45",
    durationMinutes: 45,
    status: "planned",
    priority: "normal",
    sortOrder: 200,
  },
  {
    ...tripFixture.planItems[2],
    id: "story-flight-immigration",
    activity: "Immigration",
    activityType: "travel",
    itemKind: "preparation",
    parentItemId: "story-flight-block",
    day: itineraryStoryDay,
    startTime: "11:15",
    endTime: "12:15",
    durationMinutes: 60,
    status: "planned",
    priority: "high",
    sortOrder: 300,
  },
];

export const hierarchyWarningItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "story-plain-parent",
    activity: "Plain parent",
    isPlanBlock: false,
    parentItemId: null,
    day: itineraryStoryDay,
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    sortOrder: 100,
  },
  {
    ...tripFixture.planItems[1],
    id: "story-child-under-plain-parent",
    activity: "Child under plain parent",
    parentItemId: "story-plain-parent",
    day: itineraryStoryDay,
    startTime: "09:15",
    endTime: "09:45",
    durationMinutes: 30,
    sortOrder: 200,
  },
  {
    ...tripFixture.planItems[2],
    id: "story-window-block",
    activity: "Window block",
    isPlanBlock: true,
    parentItemId: null,
    day: itineraryStoryDay,
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    sortOrder: 300,
  },
  {
    ...tripFixture.planItems[3],
    id: "story-child-outside-window",
    activity: "Child outside window",
    parentItemId: "story-window-block",
    day: itineraryStoryDay,
    startTime: "09:30",
    endTime: "11:30",
    durationMinutes: 120,
    sortOrder: 400,
  },
];

export function buildTemplateOverflowItems(): ItineraryItem[] {
  return buildOverflowStoryItems(stressPathItems, {
    activityDetail: "with long operational copy for table overflow validation",
    idPrefix: "overflow",
    placeDetail: " · gate notes, booking reference, and meet-up details",
  });
}
