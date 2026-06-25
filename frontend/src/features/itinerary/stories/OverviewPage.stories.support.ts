import type { OverviewPageProps } from "@/src/features/itinerary/components";
import type { ItineraryItem, Trip, TripDailyBriefing } from "@/src/trip/types";
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

function dateOffsetDays(date: string, offsetDays: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + offsetDays);
  return parsed.toISOString().slice(0, 10);
}

function todayIsoDate(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    .toISOString()
    .slice(0, 10);
}

function dayOffset(fromDate: string, toDate: string): number {
  const fromMs = Date.parse(`${fromDate}T00:00:00.000Z`);
  const toMs = Date.parse(`${toDate}T00:00:00.000Z`);
  return Math.round(
    (toMs - fromMs) / (24 * 60 * 60 * 1000),
  );
}

function shiftTripForPhase(
  startDate: string,
  endDate: string,
): Pick<OverviewStoryArgs, "trip" | "items" | "dailyBriefings"> {
  const offset = dayOffset(tripFixture.trip.startDate, startDate);
  const items = tripFixture.planItems.map((item): ItineraryItem => ({
    ...item,
    day: dateOffsetDays(item.day, offset),
  }));
  const trip: Trip = {
    ...tripFixture.trip,
    startDate,
    endDate,
    itineraryItems: tripFixture.trip.itineraryItems.map((item) => ({
      ...item,
      day: dateOffsetDays(item.day, offset),
    })),
  };
  const briefingOffset = dayOffset(weatherBriefings[0]?.date ?? startDate, startDate);
  const dailyBriefings = weatherBriefings.map((briefing): TripDailyBriefing => {
    const date = dateOffsetDays(briefing.date, briefingOffset);
    return {
      ...briefing,
      date,
      weather: briefing.weather
        ? {
            ...briefing.weather,
            sunrise: briefing.weather.sunrise ? `${date}T05:46` : null,
            sunset: briefing.weather.sunset ? `${date}T18:47` : null,
          }
        : null,
    };
  });
  return { trip, items, dailyBriefings };
}

const overviewStoryToday = todayIsoDate();

export const overviewPageBeforeTripStoryArgs = buildOverviewPageStoryArgs(
  shiftTripForPhase(
    dateOffsetDays(overviewStoryToday, 16),
    dateOffsetDays(overviewStoryToday, 21),
  ),
);

export const overviewPageDuringTripStoryArgs = buildOverviewPageStoryArgs(
  shiftTripForPhase(overviewStoryToday, dateOffsetDays(overviewStoryToday, 5)),
);

export const overviewPageAfterTripStoryArgs = buildOverviewPageStoryArgs(
  shiftTripForPhase(
    dateOffsetDays(overviewStoryToday, -10),
    dateOffsetDays(overviewStoryToday, -5),
  ),
);

export async function expectOverviewStructure(canvasElement: HTMLElement) {
  await expectStoryElementPresent(canvasElement, ".overview-page");
  await expectStoryElementClasses(canvasElement, ".overview-hero", "overview-hero", "grid");
  await expectStoryElementClasses(canvasElement, ".overview-travel-cockpit", "overview-travel-cockpit", "grid", "grid-cols-3");
  await expectStoryElementClasses(canvasElement, ".overview-grid", "overview-grid", "grid");
  await expectStoryElementPresent(canvasElement, ".overview-highlight-board");
}
