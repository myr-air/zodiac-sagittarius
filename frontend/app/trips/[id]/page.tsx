import { TripWorkspaceShell } from "@/components/trip/TripWorkspaceShell";

type TripPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;

  return <TripWorkspaceShell tripId={id} />;
}
