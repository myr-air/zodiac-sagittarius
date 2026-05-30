import { SagittariusApp } from "@/src/app/SagittariusApp";

export default async function TripMapPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <SagittariusApp accessMode="trip-access" initialView="map" requireJoin dataSource="api" routeTripId={tripId} />;
}
