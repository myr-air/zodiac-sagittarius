import { TripWorkspaceApp } from "@/src/trip/workspace/TripWorkspaceApp";
import { decodeTripId } from "@/src/trip/ids";

export default async function TripExpensesRoutePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <TripWorkspaceApp routeTripId={decodeTripId(tripId)} view="expenses" />;
}
