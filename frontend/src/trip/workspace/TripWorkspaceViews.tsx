"use client";

import type { ComponentProps } from "react";
import { OverviewPage, RouteMapView, SmartItineraryTable, TimelineView } from "@/src/features/itinerary/components";
import type { RouteMapViewProps } from "@/src/features/itinerary/components";
import { BookingsDocsPage } from "@/src/features/workspace/pages/bookings-docs/BookingsDocsPage";
import { TripExpensesPage } from "@/src/features/workspace/pages/expenses/TripExpensesPage";
import { TripMembersPage } from "@/src/features/workspace/pages/members/TripMembersPage";
import { TripPhotosPage } from "@/src/features/workspace/pages/photos/TripPhotosPage";
import { TripSettingsPage } from "@/src/features/workspace/pages/trip-settings/TripSettingsPage";
import type { PlanningView } from "./planning-view";

interface TripWorkspaceViewsProps {
  currentView: PlanningView;
  bookingsProps: ComponentProps<typeof BookingsDocsPage>;
  expensesProps: ComponentProps<typeof TripExpensesPage>;
  itineraryProps: ComponentProps<typeof SmartItineraryTable>;
  mapProps: RouteMapViewProps;
  membersProps: ComponentProps<typeof TripMembersPage>;
  overviewProps: ComponentProps<typeof OverviewPage>;
  photosProps: ComponentProps<typeof TripPhotosPage>;
  settingsProps: ComponentProps<typeof TripSettingsPage>;
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
