import { SagittariusApp } from "@/src/app/SagittariusApp";
import { decodeTripId } from "@/src/trip/ids";

export default async function TripSettingsRoutePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <SagittariusApp accessMode="trip-access" initialView="settings" requireJoin dataSource="api" routeTripId={decodeTripId(tripId)} />;
}
