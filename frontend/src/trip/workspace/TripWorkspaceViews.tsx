"use client";

import type { ComponentProps } from "react";
import { OverviewPage, RouteMapView, SmartItineraryTable, TimelineView } from "@/src/features/itinerary/components";
import type { RouteMapViewProps } from "@/src/features/itinerary/components";
import { BookingsDocsPage, type BookingsDocsPageProps } from "@/src/features/workspace/pages/bookings-docs/BookingsDocsPage";
import { TripExpensesPage, type TripExpensesPageProps } from "@/src/features/workspace/pages/expenses/TripExpensesPage";
import { TripMembersPage, type TripMembersPageProps } from "@/src/features/workspace/pages/members/TripMembersPage";
import { TripPhotosPage, type TripPhotosPageProps } from "@/src/features/workspace/pages/photos/TripPhotosPage";
import { TripSettingsPage, type TripSettingsPageProps } from "@/src/features/workspace/pages/trip-settings/TripSettingsPage";
import type { PlanningView } from "./planning-view";

interface TripWorkspaceViewsProps {
  currentView: PlanningView;
  bookingsProps: BookingsDocsPageProps;
  expensesProps: TripExpensesPageProps;
  itineraryProps: ComponentProps<typeof SmartItineraryTable>;
  mapProps: RouteMapViewProps;
  membersProps: TripMembersPageProps;
  overviewProps: ComponentProps<typeof OverviewPage>;
  photosProps: TripPhotosPageProps;
  settingsProps: TripSettingsPageProps;
  timelineProps: ComponentProps<typeof TimelineView>;
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
