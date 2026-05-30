import { SagittariusApp } from "@/src/app/SagittariusApp";

export default async function TripTimelinePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <SagittariusApp initialView="timeline" requireJoin dataSource="api" routeTripId={tripId} />;
}
