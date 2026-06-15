import { SagittariusApp } from "@/src/app/SagittariusApp";
import type { PlanningView } from "./planning-view";

interface TripWorkspaceAppProps {
  routeTripId: string;
  view: PlanningView;
}

export function TripWorkspaceApp({ routeTripId, view }: TripWorkspaceAppProps) {
  return (
    <SagittariusApp
      accessMode="trip-access"
      dataSource="api"
      initialView={view}
      requireJoin
      routeTripId={routeTripId}
    />
  );
}
