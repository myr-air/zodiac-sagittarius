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
      routeLiveMapMount,
      routeLiveMapRefs,
      routeLiveMapSync,
      routeLiveMapMarkers,
      routeLiveMapLayers,
      routeMapViewport,
      routeMapUtils,
      routeMapModel,
      stopDialog,
      stopFormValues,
      routeMapCanvas,
      stopDialogStory,
      stopDialogStorySupport,
      stopDialogStoryItems,
      stopDialogTypes,
      stopDialogModel,
      stopDialogDraftHook,
      stopDialogDraftTypes,
      stopDialogDraftInitialState,
      stopDialogDraftUpdaters,
      stopDialogDraftSubmit,
      stopFormModel,
      stopFormTimeFields,
      contextRailTypes,
      contextRailActionTypes,
      contextRailPanelTypes,
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
    expect(routeLiveMapHook).toContain("useRouteLiveMapMount");
    expect(routeLiveMapHook).not.toContain("maplibre-gl");
    expect(routeLiveMapHook).not.toContain("function mountLiveMap");
    expect(routeLiveMapMount).toContain("maplibre-gl");
    expect(routeLiveMapMount).toContain("function mountLiveMap");
    expect(routeLiveMapHook).toContain("useRouteLiveMapRefs");
    expect(routeLiveMapHook).toContain("useRouteLiveMapSync");
    expect(routeLiveMapHook).not.toContain("synchronizeLiveRouteMarkers");
    expect(routeLiveMapSync).toContain("export function useRouteLiveMapSync");
    expect(routeLiveMapSync).toContain("synchronizeLiveRouteMarkers");
    expect(routeLiveMapSync).toContain("synchronizeRouteLayers");
    expect(routeLiveMapRefs).toContain("export function useRouteLiveMapRefs");
    expect(routeLiveMapRefs).toContain("cleanupLiveRouteMap");
    expect(routeLiveMapHook).not.toContain("document.createElement(\"span\")");
    expect(routeLiveMapMarkers).toContain("export function synchronizeLiveRouteMarkers");
    expect(routeLiveMapMarkers).toContain("document.createElement(\"span\")");
    expect(routeLiveMapLayers).toContain("export function synchronizeRouteLayers");
    expect(routeLiveMapLayers).toContain("export function cleanupRouteLayers");
    expect(routeLiveMapLayers).toContain("routeOpacity");
    expect(routeLiveMapMarkers).not.toContain("map.addLayer");
    expect(routeMapView).toContain("RouteMapCanvas");
    expect(routeMapView).not.toContain("RouteMapUnresolvedPanel");
    expect(routeMapCanvas).toContain("RouteMapUnresolvedPanel");
    expect(routeMapView).not.toContain("unresolvedPanelListClassName");
    expect(routeMapUnresolvedPanel).toContain("unresolvedPanelListClassName");
    expect(routeMapUnresolvedPanel).toContain("export function RouteMapUnresolvedPanel");
    expect(routeMapUtils).not.toContain("export type { DayColorStyle");
    expect(routeMapUtils).not.toContain("fallbackRouteViewport");
    expect(routeMapUtils).not.toContain("getRouteCenter");
    expect(routeMapUtils).not.toContain("export function buildRoutePoints");
    expect(routeMapModel).toContain("buildRoutePoints");
    expect(routeMapModel).toContain("buildRouteDayGroups");
    expect(routeMapModel).toContain("hasCoordinates");
    expect(routeMapModel).toContain("./route-map-points");
    expect(routeMapModel).toContain("./route-map-day-groups");
    expect(routeMapViewport).toContain("export function fallbackRouteViewport");
    expect(routeMapViewport).toContain("export function getRouteCenter");

    expect(stopDialogModel).toContain("./use-stop-dialog-draft-state");
    expect(stopDialogModel).not.toContain("applyStopActivityInput");
    expect(stopDialogDraftHook).toContain("./stop-dialog-draft-initial-state");
    expect(stopDialogDraftHook).toContain("./stop-dialog-draft-submit");
    expect(stopDialogDraftHook).toContain("./stop-dialog-draft-updaters");
    expect(stopDialogDraftHook).toContain("export function useStopDialogDraftState");
    expect(stopDialogDraftTypes).toContain("export interface StopDialogDraftState");
    expect(stopDialogDraftInitialState).toContain("buildInitialStopFormValues");
    expect(stopDialogDraftUpdaters).toContain("applyStopActivityInput");
    expect(stopDialogDraftSubmit).toContain("buildStopSubmitValues");
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
    expect(stopFormValues).toContain("export interface StopFormValues");
    expect(stopDialogTypes).toContain("../../domain/stop-form-values");
    expect(stopDialogTypes).not.toContain("export interface StopFormValues");
    expect(stopDialogDraftHook).not.toContain("@/src/features/itinerary/domain/stop-form-model");
    expect(stopDialogDraftUpdaters).toContain("@/src/features/itinerary/domain/stop-form-model");
    expect(stopFormModel).toContain("./stop-form-time-fields");
    expect(stopFormModel).not.toContain("durationBetweenTimes");
    expect(stopFormModel).toContain("applyStopActivityInput");
    expect(stopFormModel).toContain("./stop-form-activity-input");
    expect(stopFormTimeFields).toContain("export function applyStopStartTime");
    expect(stopFormTimeFields).toContain("export function applyStopEndTime");
    expect(stopFormTimeFields).toContain("export function applyStopTimeMode");

    expect(contextRailTypes).toContain("./context-rail-actions.types");
    expect(contextRailTypes).toContain("./context-rail-panel.types");
    expect(contextRailTypes).not.toContain("export interface ContextRailProps");
    expect(contextRailTypes).not.toContain("@/src/trip/booking-docs");
    expect(contextRailActionTypes).toContain("ContextRailCreateNoteInput");
    expect(contextRailActionTypes).toContain("ContextRailBookingDocHandlers");
    expect(contextRailActionTypes).not.toContain("ContextRailSelectedStopPanelProps");
    expect(contextRailPanelTypes).toContain("export interface ContextRailProps");
    expect(contextRailPanelTypes).toContain("ContextRailSelectedStopPanelProps");
    expect(contextRailPanelTypes).toContain("./context-rail-actions.types");
  });
});
