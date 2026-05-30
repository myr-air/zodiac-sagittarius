import { SagittariusApp } from "@/src/app/SagittariusApp";

export default async function TripMembersPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <SagittariusApp initialView="members" requireJoin dataSource="api" routeTripId={tripId} />;
}
