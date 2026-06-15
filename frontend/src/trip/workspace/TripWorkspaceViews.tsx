"use client";

import type { ComponentProps } from "react";
import { BookingsDocsPage } from "@/src/components/BookingsDocsPage";
import { OverviewPage } from "@/src/components/OverviewPage";
import { RouteMapView } from "@/src/components/RouteMapView";
import { SmartItineraryTable } from "@/src/components/SmartItineraryTable";
import { TimelineView } from "@/src/components/TimelineView";
import { TripExpensesPage } from "@/src/components/TripExpensesPage";
import { TripMembersPage } from "@/src/components/TripMembersPage";
import { TripPhotosPage } from "@/src/components/TripPhotosPage";
import { TripSettingsPage } from "@/src/components/TripSettingsPage";
import type { PlanningView } from "./planning-view";

interface TripWorkspaceViewsProps {
  currentView: PlanningView;
  bookingsProps: ComponentProps<typeof BookingsDocsPage>;
  expensesProps: ComponentProps<typeof TripExpensesPage>;
  itineraryProps: ComponentProps<typeof SmartItineraryTable>;
  mapProps: ComponentProps<typeof RouteMapView>;
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
