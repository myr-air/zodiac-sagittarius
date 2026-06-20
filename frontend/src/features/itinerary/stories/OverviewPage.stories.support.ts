import { expect } from "storybook/test";
import type { OverviewPageProps } from "@/src/features/itinerary/components";
import { weatherBriefings } from "@/src/shared/components/weather";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { noop } from "@/src/testing/storybook-actions";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  denseTripFixture,
  emptyTripFixture,
} from "./itinerary-story-fixtures";

type OverviewStoryArgs = OverviewPageProps;

export const overviewOwnerStoryArgs = {
  trip: tripFixture.trip,
  currentMemberId: tripFixture.currentMembers.owner.id,
  expenseSummary: tripFixture.expenseSummaries.owner,
  items: tripFixture.planItems,
  suggestions: tripFixture.suggestions,
  tasks: tripFixture.tasks,
  onCreateTask: noop,
  onToggleTaskStatus: noop,
} satisfies OverviewStoryArgs;

export const overviewTemplateOwnerStoryArgs = overviewOwnerStoryArgs;

export const overviewPageOwnerStoryArgs = {
  ...overviewOwnerStoryArgs,
  dailyBriefings: weatherBriefings,
  onSaveDailyBriefingOverrides: noop,
} satisfies OverviewStoryArgs;

export const overviewTemplateTravelerStoryArgs = {
  ...overviewTemplateOwnerStoryArgs,
  currentMemberId: tripFixture.currentMembers.traveler.id,
  expenseSummary: tripFixture.expenseSummaries.traveler,
} satisfies OverviewStoryArgs;

export const overviewPageTravelerStoryArgs = {
  ...overviewPageOwnerStoryArgs,
  currentMemberId: tripFixture.currentMembers.traveler.id,
  expenseSummary: tripFixture.expenseSummaries.traveler,
} satisfies OverviewStoryArgs;

export const overviewTemplateViewerStoryArgs = {
  ...overviewTemplateOwnerStoryArgs,
  currentMemberId: tripFixture.currentMembers.viewer.id,
  expenseSummary: tripFixture.expenseSummaries.viewer,
} satisfies OverviewStoryArgs;

export const overviewPageViewerStoryArgs = {
  ...overviewPageOwnerStoryArgs,
  currentMemberId: tripFixture.currentMembers.viewer.id,
  expenseSummary: tripFixture.expenseSummaries.viewer,
} satisfies OverviewStoryArgs;

export const overviewTemplateDenseStoryArgs = {
  ...overviewTemplateOwnerStoryArgs,
  trip: denseTripFixture,
  items: denseTripFixture.itineraryItems,
} satisfies OverviewStoryArgs;

export const overviewPageDenseStoryArgs = {
  ...overviewPageOwnerStoryArgs,
  trip: denseTripFixture,
  items: denseTripFixture.itineraryItems,
} satisfies OverviewStoryArgs;

export const overviewTemplateEmptyStoryArgs = {
  ...overviewTemplateOwnerStoryArgs,
  trip: emptyTripFixture,
  items: [],
  suggestions: [],
  tasks: [],
  expenseSummary: buildExpenseSummary([], tripFixture.currentMembers.owner.id),
} satisfies OverviewStoryArgs;

export const overviewPageEmptyStoryArgs = {
  ...overviewPageOwnerStoryArgs,
  trip: emptyTripFixture,
  items: [],
  suggestions: [],
  tasks: [],
  dailyBriefings: [],
} satisfies OverviewStoryArgs;

export async function expectOverviewStructure(canvasElement: HTMLElement) {
  await expect(canvasElement.querySelector(".overview-page")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".overview-hero")).toHaveClass("overview-hero", "grid");
  await expect(canvasElement.querySelector(".overview-travel-cockpit")).toHaveClass("overview-travel-cockpit", "grid", "grid-cols-3");
  await expect(canvasElement.querySelector(".overview-grid")).toHaveClass("overview-grid", "grid");
  await expect(canvasElement.querySelector(".overview-highlight-board")).toBeInTheDocument();
}
