import { TripWorkspaceApp } from "@/src/trip/TripWorkspaceApp";
import { decodeTripId } from "@/src/trip/ids";

export default async function TripBookingsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <TripWorkspaceApp routeTripId={decodeTripId(tripId)} view="bookings" />;
}
