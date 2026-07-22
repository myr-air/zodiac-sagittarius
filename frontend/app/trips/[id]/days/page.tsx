import { DayWorkspacePage } from "@/components/trip/DayWorkspacePage";

type DayWorkspaceRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function DayWorkspaceRoute({
  params,
}: DayWorkspaceRouteProps) {
  const { id } = await params;

  return <DayWorkspacePage tripId={id} />;
}
