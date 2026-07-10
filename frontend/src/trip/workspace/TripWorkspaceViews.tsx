"use client";

import { OverviewPage, RouteMapView, SmartItineraryTable, TimelineView } from "@/src/features/itinerary/components";
import type {
  OverviewPageProps,
  RouteMapViewProps,
  SmartItineraryTableProps,
  TimelineViewProps,
} from "@/src/features/itinerary/components";
import { BookingsDocsPage, type BookingsDocsPageProps } from "@/src/features/workspace/pages/bookings-docs/BookingsDocsPage";
import { TripExpensesPage, type TripExpensesPageProps } from "@/src/features/workspace/pages/expenses/TripExpensesPage";
import { TripMembersPage, type TripMembersPageProps } from "@/src/features/workspace/pages/members/TripMembersPage";
import { TripPhotosPage, type TripPhotosPageProps } from "@/src/features/workspace/pages/photos/TripPhotosPage";
import { TripSettingsPage, type TripSettingsPageProps } from "@/src/features/workspace/pages/trip-settings/TripSettingsPage";
import { DreamerPage } from "@/src/features/workspace/pages/dreamer/DreamerPage";
import type { DreamerPageProps } from "@/src/features/workspace/pages/dreamer/DreamerPage.types";
import { FlexibleHunterPage } from "@/src/features/workspace/pages/flexible-hunter/FlexibleHunterPage";
import type { FlexibleHunterPageProps } from "@/src/features/workspace/pages/flexible-hunter/FlexibleHunterPage.types";
import type { PlanningView } from "./planning-view";

export interface TripWorkspaceViewsProps {
  currentView: PlanningView;
  bookingsProps: BookingsDocsPageProps;
  detailPlannerProps?: DetailPlannerPageProps;
  routeBuilderProps?: RouteBuilderPageProps;
  expensesProps: TripExpensesPageProps;
  itineraryProps: SmartItineraryTableProps;
  mapProps: RouteMapViewProps;
  membersProps: TripMembersPageProps;
  overviewProps: OverviewPageProps;
  photosProps: TripPhotosPageProps;
  settingsProps: TripSettingsPageProps;
  timelineProps: TimelineViewProps;
  dreamerProps?: DreamerPageProps;
  flexibleHunterProps?: FlexibleHunterPageProps;
}

export function TripWorkspaceViews({
  currentView,
  bookingsProps,
  detailPlannerProps,
  routeBuilderProps,
  expensesProps,
  itineraryProps,
  mapProps,
  membersProps,
  overviewProps,
  photosProps,
  settingsProps,
  timelineProps,
  dreamerProps,
  flexibleHunterProps,
}: TripWorkspaceViewsProps) {
  if (currentView === "settings") {
    return <TripSettingsPage {...settingsProps} />;
  }

  if (currentView === "members") {
    return <TripMembersPage {...membersProps} />;
  }

  if (currentView === "bookings") {
    return <BookingsDocsPage {...bookingsProps} />;
  }

  if (currentView === "photos") {
    return <TripPhotosPage {...photosProps} />;
  }

  if (currentView === "expenses") {
    return <TripExpensesPage {...expensesProps} />;
  }

  if (currentView === "overview") {
    return <OverviewPage {...overviewProps} />;
  }

  if (currentView === "itinerary") {
    return <SmartItineraryTable {...itineraryProps} />;
  }

  if (currentView === "map") {
    return <RouteMapView {...mapProps} />;
  }

  if (currentView === "dreamer" && dreamerProps) {
    return <DreamerPage {...dreamerProps} />;
  }

  if (currentView === "flexible-hunter" && flexibleHunterProps) {
    return <FlexibleHunterPage {...flexibleHunterProps} />;
  }

  return <TimelineView {...timelineProps} />;
}
