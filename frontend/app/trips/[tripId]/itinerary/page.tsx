import { SagittariusApp } from "@/src/app/SagittariusApp";

export default async function TripItineraryPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <SagittariusApp initialView="itinerary" requireJoin dataSource="api" routeTripId={tripId} />;
}
