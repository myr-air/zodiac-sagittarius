import { describe, expect, it } from "vitest";
import { frontendRoot } from "./project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace feature source boundaries", () => {
  it("keeps booking docs, itinerary, map, and settings components split by responsibility", () => {
    const {
      bookingDisplay,
      bookingFolders,
      bookingList,
      bookingDialog,
      bookingDialogState,
      sagaCore,
      itineraryTimeLib,
      overviewPage,
      overviewSummaryBand,
      overviewCockpit,
      overviewTaskDialog,
      overviewTaskLayer,
      overviewWeatherBriefing,
      routeMapTypes,
      smartItineraryTable,
      smartItineraryTablePageHeader,
      routeMapView,
      routeMapUnresolvedPanel,
      routeLiveMapHook,
      routeLiveMapMarkers,
      routeMapViewport,
      routeMapUtils,
      stopDialog,
      stopDialogStory,
      stopDialogStorySupport,
      stopDialogModel,
      stopDialogForm,
      stopDialogTimeFields,
      tripSettingsPageSource,
      tripSettingsIndexSource,
      memberSupport,
      dateTimePickers,
      itineraryStoryFixtures,
      itineraryStoryPathScenarios,
      itineraryPageStory,
      itineraryPageStoryPlays,
      itineraryTemplateStory,
      itineraryTemplateStoryPlays,
      tripSettingsPage,
      tripSettingsSupport,
      tripSettingsFormState,
      workspaceCoreFrameProps,
      workspaceFrameProps,
      workspaceFrameActionProps,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(bookingDisplay).toContain("export function formatDateTime");
    expect(bookingDisplay).toContain("export function bookingTypeIcon");
    expect(bookingDisplay).not.toContain("function toDateTimeLocalValue");
    expect(bookingDisplay).not.toContain("function fromDateTimeLocalValue");
    expect(bookingDisplay).not.toContain("function toggleId");
    expect(bookingDisplay).not.toContain("bookingFolders");
    expect(bookingDisplay).not.toContain("bookingDocMatchesQuery");
    expect(bookingDisplay).not.toContain("compareBookingStartWithUndated");
    expect(bookingFolders).toContain("export const bookingFolders");
    expect(bookingFolders).toContain("export function countBookingFolders");
    expect(bookingList).toContain("export function bookingDocMatchesQuery");
    expect(bookingList).toContain("export function compareBookingStartWithUndated");
    expect(bookingDialog).toContain("./useBookingDialogState");
    expect(bookingDialog).not.toContain("useState");
    expect(bookingDialog).not.toContain("@/src/features/itinerary/lib/itinerary-time");
    expect(bookingDialog).not.toContain("@/src/features/itinerary/lib/itinerary-item-helpers");
    expect(bookingDialog).not.toContain("DateTimePickerField");
    expect(bookingDialog).not.toContain("CheckboxGroup");
    expect(bookingDialog).toContain("BookingDialogFields");
    expect(bookingDialog).toContain("BookingDialogLinks");
    expect(bookingDialogState).toContain("export function useBookingDialogState");
    expect(bookingDialogState).toContain("export type BookingDialogState");
    expect(bookingDialogState).toContain("@/src/features/itinerary/lib/itinerary-time");
    expect(bookingDialogState).toContain("@/src/features/itinerary/lib/itinerary-item-helpers");
    expect(bookingDialogState).toContain("function submit");
    expect(sagaCore).toContain("buildWorkspaceCoreFrameProps");
    expect(sagaCore).not.toContain("buildWorkspaceFrameActionProps");
    expect(workspaceCoreFrameProps).toContain("buildWorkspaceFrameProps");
    expect(workspaceFrameProps).toContain("buildWorkspaceFrameActionProps");
    expect(sagaCore).not.toContain("void createItineraryNote(itemId, body)");
    expect(workspaceFrameActionProps).toContain("onAddNoteForItem");
    expect(workspaceFrameActionProps).toContain("onTransferOwnership");

    expect(itineraryStoryFixtures).toContain("./itinerary-story-path-scenarios");
    expect(itineraryStoryFixtures).not.toContain("buildItineraryStoryPathItems");
    expect(itineraryStoryFixtures).not.toContain("const stressPathItemsBase");
    expect(itineraryStoryPathScenarios).toContain("buildItineraryStoryPathItems");
    expect(itineraryStoryPathScenarios).toContain("export const stressPathItemsBase");
    expect(itineraryPageStory).toContain("./ItineraryPage.stories.plays");
    expect(itineraryPageStory).not.toContain("./itinerary-story-assertions");
    expect(itineraryPageStoryPlays).toContain("./itinerary-story-assertions");
    expect(itineraryTemplateStory).toContain("./ItineraryTemplate.stories.plays");
    expect(itineraryTemplateStory).not.toContain("./itinerary-story-assertions");
    expect(itineraryTemplateStoryPlays).toContain("./itinerary-story-assertions");
    expect(itineraryTimeLib).toContain("@/src/trip/itinerary-time");
    expect(itineraryTimeLib).not.toContain("/^(\\d{2}):(\\d{2})$/");

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
    expect(smartItineraryTable).not.toContain("@/src/shared/components/page-header");
    expect(smartItineraryTable).not.toContain("SmartItineraryTableHeaderControls");
    expect(smartItineraryTablePageHeader).toContain("PageHeader");
    expect(smartItineraryTablePageHeader).toContain("SmartItineraryTableHeaderControls");
    expect(smartItineraryTablePageHeader).toContain("SmartItineraryTableMeta");
    expect(routeMapTypes).toContain("export interface MapCoordinateResolutionResult");
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
    expect(routeMapView).toContain("RouteMapUnresolvedPanel");
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
    expect(stopDialogStorySupport).toContain("export function stopDialogCategoryItem");
    expect(stopDialogForm).toContain("./stop-dialog-time-fields");
    expect(stopDialogForm).not.toContain("durationBetweenTimes");
    expect(stopDialogForm).toContain("export function applyStopActivityInput");
    expect(stopDialogTimeFields).toContain("export function applyStopStartTime");
    expect(stopDialogTimeFields).toContain("export function applyStopEndTime");
    expect(stopDialogTimeFields).toContain("export function applyStopTimeMode");

    expect(tripSettingsPageSource).not.toContain("export interface TripSettingsFormValues");
    expect(tripSettingsIndexSource).toContain("./TripSettingsPage.types");
    expect(memberSupport).toContain("@/src/routes/invite-links");
    expect(memberSupport).not.toContain("function buildInviteLink");
    expect(dateTimePickers).toContain("./DatePickerField");
    expect(dateTimePickers).toContain("./DateTimePickerField");
    expect(dateTimePickers).toContain("./TimePickerField");
    expect(dateTimePickers).not.toContain("function CalendarContent");
    expect(dateTimePickers).not.toContain("function TimePickerContent");
    expect(dateTimePickers).not.toContain("createPortal");
    expect(tripSettingsPage).toContain("./TripSettingsPage.support");
    expect(tripSettingsPage).toContain("./use-trip-settings-form-state");
    expect(tripSettingsSupport).toContain("@/src/trip/itinerary-time");
    expect(tripSettingsPage).not.toContain("function daysBetweenIsoDates");
    expect(tripSettingsPage).not.toContain("function shiftIsoDate");
    expect(tripSettingsPage).not.toContain("useState");
    expect(tripSettingsPage).not.toContain("normalizeTripSettingsForm");
    expect(tripSettingsSupport).not.toContain("function daysBetweenIsoDates");
    expect(tripSettingsSupport).not.toContain("function shiftIsoDate");
    expect(tripSettingsFormState).toContain("useTripSettingsFormState");
    expect(tripSettingsFormState).toContain("normalizeTripSettingsForm");
  });
});
