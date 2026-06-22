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
import type { PlanningView } from "./planning-view";

export interface TripWorkspaceViewsProps {
  currentView: PlanningView;
  bookingsProps: BookingsDocsPageProps;
  expensesProps: TripExpensesPageProps;
  itineraryProps: SmartItineraryTableProps;
  mapProps: RouteMapViewProps;
  membersProps: TripMembersPageProps;
  overviewProps: OverviewPageProps;
  photosProps: TripPhotosPageProps;
  settingsProps: TripSettingsPageProps;
  timelineProps: TimelineViewProps;
}

export function TripWorkspaceViews({
  currentView,
  bookingsProps,
  expensesProps,
  itineraryProps,
  mapProps,
  membersProps,
  overviewProps,
  photosProps,
  settingsProps,
  timelineProps,
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

  return <TimelineView {...timelineProps} />;
}
