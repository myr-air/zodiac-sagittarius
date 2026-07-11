import { TripWorkspaceApp } from "@/src/trip/workspace/TripWorkspaceApp";
import { decodeTripId } from "@/src/trip/identity";

export default async function TripOnTripCompanionPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <TripWorkspaceApp routeTripId={decodeTripId(tripId)} view="on-trip-companion" />;
}
