import { SagittariusApp } from "@/src/app/SagittariusApp";

export default async function TripOverviewPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <SagittariusApp initialView="overview" requireJoin dataSource="api" routeTripId={tripId} />;
}
