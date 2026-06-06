import { SagittariusApp } from "@/src/app/SagittariusApp";
import { decodeTripId } from "@/src/trip/ids";

export default async function TripExpensesRoutePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <SagittariusApp accessMode="trip-access" initialView="expenses" requireJoin dataSource="api" routeTripId={decodeTripId(tripId)} />;
}
