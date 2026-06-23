import { describe, expect, it } from "vitest";
import { readItineraryArchitectureSource } from "./project-itinerary-architecture.test-support";

describe("Sagittarius itinerary weather architecture contracts", () => {
  it("keeps itinerary table weather formatting split from path utilities", () => {
    const tableUtils = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-utils.ts");
    const tableGrouping = readItineraryArchitectureSource("src/features/itinerary/domain/itinerary-table-grouping.ts");
    const tableGraph = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-graph.ts");
    const tableLabels = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-labels.ts");
    const tableTripPlanLabels = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-trip-plan-labels.ts");
    const weatherSummary = readItineraryArchitectureSource("src/features/itinerary/domain/weather-summary.ts");
    const weatherChip = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/day-weather-chip.tsx");

    expect(tableUtils).not.toContain("TripDailyBriefing");
    expect(tableUtils).not.toContain("weather-briefings");
    expect(tableUtils).not.toContain("buildWeatherSummary");
    expect(tableUtils).not.toContain("buildWeatherTooltip");
    expect(tableUtils).toContain("@/src/features/itinerary/domain/itinerary-table-grouping");
    expect(tableUtils).toContain("./smart-itinerary-table-graph");
    expect(tableUtils).toContain("./smart-itinerary-table-labels");
    expect(tableUtils).toContain("./smart-itinerary-table-trip-plan-labels");
    expect(tableUtils).not.toContain("function mergeTripDayGroups");
    expect(tableUtils).not.toContain("function itemStatusLabel");
    expect(tableGrouping).toContain("export function mergeTripDayGroups");
    expect(tableGrouping).toContain("export function groupChildItemsByParent");
    expect(tableGraph).toContain("export function buildGraphColumnWidth");
    expect(tableLabels).toContain("export function itemStatusLabel");
    expect(tableLabels).toContain("export function formatSelectedPlanLabel");
    expect(tableTripPlanLabels).toContain("export function tripPlanStatus");
    expect(weatherSummary).toContain("export function buildWeatherSummary");
    expect(weatherSummary).toContain("export function buildWeatherTooltip");
    expect(weatherChip).toContain("@/src/features/itinerary/domain/weather-summary");
  });

  it("keeps weather briefing drawer formatting split from render", () => {
    const drawer = readItineraryArchitectureSource("src/shared/components/weather/WeatherBriefingDrawer.tsx");
    const drawerModel = readItineraryArchitectureSource("src/shared/components/weather/model/weather-briefing-drawer-model.ts");
    const drawerCopy = readItineraryArchitectureSource("src/shared/components/weather/model/weather-briefing-drawer-copy.ts");
    const textBlock = readItineraryArchitectureSource("src/shared/components/weather/WeatherTextBlock.tsx");
    const sourceMeta = readItineraryArchitectureSource("src/shared/components/weather/WeatherSourceMeta.tsx");
    const overrideForm = readItineraryArchitectureSource("src/shared/components/weather/WeatherOrganizerOverrideForm.tsx");

    expect(drawer).toContain("./model/weather-briefing-drawer-model");
    expect(drawer).toContain("./WeatherTextBlock");
    expect(drawer).toContain("./WeatherSourceMeta");
    expect(drawer).toContain("./WeatherOrganizerOverrideForm");
    expect(drawer).not.toContain("function formatWeatherSummary");
    expect(drawer).not.toContain("function buildWeatherDetailLines");
    expect(drawer).not.toContain("function weatherDrawerCopy");
    expect(drawer).not.toContain("function TextBlock");
    expect(drawer).not.toContain("function SourceMeta");
    expect(drawer).not.toContain("function OrganizerOverrideForm");
    expect(drawerModel).toContain("export function formatWeatherSummary");
    expect(drawerModel).toContain("export function buildWeatherDetailLines");
    expect(drawerModel).toContain("./weather-briefing-drawer-copy");
    expect(drawerModel).not.toContain('regionLabel: "Weather briefing"');
    expect(drawerCopy).toContain("export function weatherDrawerCopy");
    expect(drawerCopy).toContain("export function emptyText");
    expect(textBlock).toContain("export function WeatherTextBlock");
    expect(textBlock).toContain("./WeatherSourceMeta");
    expect(sourceMeta).toContain("export function WeatherSourceMeta");
    expect(overrideForm).toContain("export function WeatherOrganizerOverrideForm");
  });

  it("keeps weather forecast strip formatting split from render", () => {
    const strip = readItineraryArchitectureSource("src/shared/components/weather/WeatherForecastStrip.tsx");
    const stripModel = readItineraryArchitectureSource("src/shared/components/weather/model/weather-forecast-strip-model.ts");

    expect(strip).toContain("./model/weather-forecast-strip-model");
    expect(strip).not.toContain("function formatDayLabel");
    expect(strip).not.toContain("function weatherStripCopy");
    expect(strip).not.toContain("displayDateTimeLocaleCode");
    expect(stripModel).toContain("export function formatWeatherStripDayLabel");
    expect(stripModel).toContain("export function weatherStripCopy");
  });
});
