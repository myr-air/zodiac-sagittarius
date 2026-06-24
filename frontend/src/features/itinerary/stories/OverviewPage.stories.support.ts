import type { OverviewPageProps } from "@/src/features/itinerary/components";
import {
  expectStoryElementClasses,
  expectStoryElementPresent,
} from "@/src/shared/storybook/story-assertions";
import { weatherBriefings } from "@/src/shared/components/weather/testing/WeatherBriefing.fixtures";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { noop } from "@/src/testing/storybook-actions";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  denseTripFixture,
  emptyTripFixture,
} from "./support/itinerary-story-fixtures";

type OverviewStoryArgs = OverviewPageProps;
type OverviewStoryArgOverrides = Partial<OverviewStoryArgs>;

const overviewPageOnlyStoryArgs = {
  dailyBriefings: weatherBriefings,
  onSaveDailyBriefingOverrides: noop,
} satisfies OverviewStoryArgOverrides;

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

function buildOverviewTemplateStoryArgs(
  overrides: OverviewStoryArgOverrides = {},
): OverviewStoryArgs {
  return {
    ...overviewOwnerStoryArgs,
    ...overrides,
  };
}

function buildOverviewPageStoryArgs(
  overrides: OverviewStoryArgOverrides = {},
): OverviewStoryArgs {
  return {
    ...overviewOwnerStoryArgs,
    ...overviewPageOnlyStoryArgs,
    ...overrides,
  };
}

export const overviewTemplateOwnerStoryArgs = buildOverviewTemplateStoryArgs();

export const overviewPageOwnerStoryArgs = buildOverviewPageStoryArgs();

const travelerOverviewStoryOverrides = {
  currentMemberId: tripFixture.currentMembers.traveler.id,
  expenseSummary: tripFixture.expenseSummaries.traveler,
} satisfies OverviewStoryArgOverrides;

export const overviewTemplateTravelerStoryArgs = buildOverviewTemplateStoryArgs(
  travelerOverviewStoryOverrides,
);

export const overviewPageTravelerStoryArgs = buildOverviewPageStoryArgs(
  travelerOverviewStoryOverrides,
);

const viewerOverviewStoryOverrides = {
  currentMemberId: tripFixture.currentMembers.viewer.id,
  expenseSummary: tripFixture.expenseSummaries.viewer,
} satisfies OverviewStoryArgOverrides;

export const overviewTemplateViewerStoryArgs = buildOverviewTemplateStoryArgs(
  viewerOverviewStoryOverrides,
);

export const overviewPageViewerStoryArgs = buildOverviewPageStoryArgs(
  viewerOverviewStoryOverrides,
);

const denseOverviewStoryOverrides = {
  trip: denseTripFixture,
  items: denseTripFixture.itineraryItems,
} satisfies OverviewStoryArgOverrides;

export const overviewTemplateDenseStoryArgs = buildOverviewTemplateStoryArgs(
  denseOverviewStoryOverrides,
);

export const overviewPageDenseStoryArgs = buildOverviewPageStoryArgs(
  denseOverviewStoryOverrides,
);

const emptyOverviewStoryOverrides = {
  trip: {
    ...emptyTripFixture,
    startDate: "2036-06-18",
    endDate: "2036-06-23",
  },
  items: [],
  suggestions: [],
  tasks: [],
} satisfies OverviewStoryArgOverrides;

export const overviewTemplateEmptyStoryArgs = buildOverviewTemplateStoryArgs({
  ...emptyOverviewStoryOverrides,
  expenseSummary: buildExpenseSummary([], tripFixture.currentMembers.owner.id),
});

export const overviewPageEmptyStoryArgs = buildOverviewPageStoryArgs({
  ...emptyOverviewStoryOverrides,
  dailyBriefings: [],
});

export async function expectOverviewStructure(canvasElement: HTMLElement) {
  await expectStoryElementPresent(canvasElement, ".overview-page");
  await expectStoryElementClasses(canvasElement, ".overview-hero", "overview-hero", "grid");
  await expectStoryElementClasses(canvasElement, ".overview-travel-cockpit", "overview-travel-cockpit", "grid", "grid-cols-3");
  await expectStoryElementClasses(canvasElement, ".overview-grid", "overview-grid", "grid");
  await expectStoryElementPresent(canvasElement, ".overview-highlight-board");
}
