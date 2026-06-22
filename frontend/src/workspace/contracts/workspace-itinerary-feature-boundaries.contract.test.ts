import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace itinerary feature source boundaries", () => {
  it("keeps itinerary, map, and stop-dialog components split by responsibility", () => {
    const {
      overviewPage,
      overviewSummaryBand,
      overviewCockpit,
      overviewTaskDialog,
      overviewTaskLayer,
      overviewWeatherBriefing,
      routeMapTypes,
      smartItineraryTable,
      smartItineraryTableTypes,
      smartItineraryTablePageHeader,
      routeMapView,
      placeTypes,
      routeMapUnresolvedPanel,
      routeLiveMapHook,
      routeLiveMapMarkers,
      routeMapViewport,
      routeMapUtils,
      stopDialog,
      routeMapCanvas,
      stopDialogStory,
      stopDialogStorySupport,
      stopDialogStoryItems,
      stopDialogModel,
      stopDialogForm,
      stopDialogTimeFields,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(overviewPage).toContain("OverviewSummaryBand");
    expect(overviewPage).not.toContain("OverviewCockpit");
    expect(overviewPage).not.toContain("overviewCockpitClassName");
    expect(overviewSummaryBand).toContain("OverviewCockpit");
    expect(overviewCockpit).toContain("export function OverviewCockpit");
    expect(overviewCockpit).toContain("overviewCockpitClassName");
    expect(overviewPage).toContain("OverviewTaskLayer");
    expect(overviewPage).not.toContain("OverviewTaskDialog");
    expect(overviewPage).not.toContain("overviewUndoToastClassName");
    expect(overviewPage).not.toContain("taskDialogGridClassName");
    expect(overviewTaskLayer).toContain("OverviewTaskDialog");
    expect(overviewTaskLayer).toContain("overviewUndoToastClassName");
    expect(overviewTaskDialog).toContain("export function OverviewTaskDialog");
    expect(overviewTaskDialog).toContain("taskDialogGridClassName");
    expect(overviewPage).not.toContain("OverviewWeatherBriefing");
    expect(overviewSummaryBand).toContain("OverviewWeatherBriefing");
    expect(overviewPage).not.toContain("WeatherBriefingDrawer");
    expect(overviewWeatherBriefing).toContain("WeatherBriefingDrawer");
    expect(overviewWeatherBriefing).toContain("WeatherForecastStrip");

    expect(smartItineraryTable).toContain("SmartItineraryTablePageHeader");
    expect(smartItineraryTable).toContain("./SmartItineraryTable.types");
    expect(smartItineraryTable).not.toContain("interface SmartItineraryTableProps");
    expect(smartItineraryTableTypes).toContain("export interface SmartItineraryTableProps");
    expect(smartItineraryTable).not.toContain("@/src/shared/components/page-header");
    expect(smartItineraryTable).not.toContain("SmartItineraryTableHeaderControls");
    expect(smartItineraryTablePageHeader).toContain("PageHeader");
    expect(smartItineraryTablePageHeader).toContain("SmartItineraryTableHeaderControls");
    expect(smartItineraryTablePageHeader).toContain("SmartItineraryTableMeta");
    expect(placeTypes).toContain("export interface MapCoordinateResolutionResult");
    expect(routeMapTypes).toContain("@/src/trip/places");
    expect(routeMapTypes).not.toContain("export interface MapCoordinateResolutionResult");
    expect(routeMapView).not.toContain("export interface MapCoordinateResolutionResult");
    expect(routeMapView).toContain("useRouteLiveMap");
    expect(routeMapView).not.toContain("maplibre-gl");
    expect(routeMapView).not.toContain("function mountLiveMap");
    expect(routeLiveMapHook).toContain("export function useRouteLiveMap");
    expect(routeLiveMapHook).toContain("maplibre-gl");
    expect(routeLiveMapHook).toContain("function mountLiveMap");
    expect(routeLiveMapHook).toContain("synchronizeLiveRouteMarkers");
    expect(routeLiveMapHook).not.toContain("document.createElement(\"span\")");
    expect(routeLiveMapMarkers).toContain("export function synchronizeLiveRouteMarkers");
    expect(routeLiveMapMarkers).toContain("document.createElement(\"span\")");
    expect(routeMapView).toContain("RouteMapCanvas");
    expect(routeMapView).not.toContain("RouteMapUnresolvedPanel");
    expect(routeMapCanvas).toContain("RouteMapUnresolvedPanel");
    expect(routeMapView).not.toContain("unresolvedPanelListClassName");
    expect(routeMapUnresolvedPanel).toContain("unresolvedPanelListClassName");
    expect(routeMapUnresolvedPanel).toContain("export function RouteMapUnresolvedPanel");
    expect(routeMapUtils).not.toContain("export type { DayColorStyle");
    expect(routeMapUtils).not.toContain("fallbackRouteViewport");
    expect(routeMapUtils).not.toContain("getRouteCenter");
    expect(routeMapViewport).toContain("export function fallbackRouteViewport");
    expect(routeMapViewport).toContain("export function getRouteCenter");

    expect(stopDialogModel).toContain("applyStopActivityInput");
    expect(stopDialog).not.toContain("parseRouteActivity");
    expect(stopDialog).not.toContain("endOffsetDaysBetweenTimes");
    expect(stopDialogStory).toContain("./StopDialog.stories.support");
    expect(stopDialogStory).not.toContain("tripFixture");
    expect(stopDialogStory).not.toContain("function categoryItem");
    expect(stopDialogStorySupport).toContain("export const stopDialogCreateArgs");
    expect(stopDialogStorySupport).toContain("./StopDialog.stories.items");
    expect(stopDialogStorySupport).not.toContain("export function stopDialogCategoryItem");
    expect(stopDialogStorySupport).not.toContain("export const transportationStoryItem");
    expect(stopDialogStoryItems).toContain("export function stopDialogCategoryItem");
    expect(stopDialogStoryItems).toContain("export const transportationStoryItem");
    expect(stopDialogForm).toContain("./stop-dialog-time-fields");
    expect(stopDialogForm).not.toContain("durationBetweenTimes");
    expect(stopDialogForm).toContain("export function applyStopActivityInput");
    expect(stopDialogTimeFields).toContain("export function applyStopStartTime");
    expect(stopDialogTimeFields).toContain("export function applyStopEndTime");
    expect(stopDialogTimeFields).toContain("export function applyStopTimeMode");
  });
});
