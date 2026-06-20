"use client";

import { seedTrip } from "@/src/trip/seed";
import { useSagittariusWorkspaceContexts } from "./hooks";
import { WorkspaceAppFrame } from "./WorkspaceAppFrame";
import { buildWorkspaceCoreFrameProps } from "./props";
import type { SagittariusAppProps } from "./types";

export function SagittariusApp({
  initialView = "overview",
  requireJoin = false,
  dataSource = "local",
  apiClient,
  placeResolver,
  routeTripId,
  initialJoinCode,
  initialJoinToken,
  accessMode = "combined",
  accountSuccessRedirectHref,
  portalSection = "dashboard",
  initialMemberId,
  initialTrip = seedTrip,
}: SagittariusAppProps) {
  const { commands, planning, setup, t } = useSagittariusWorkspaceContexts({
    accessMode,
    apiClient,
    dataSource,
    initialJoinToken,
    initialMemberId,
    initialTrip,
    initialView,
    placeResolver,
    requireJoin,
    routeTripId,
  });

  const frameProps = buildWorkspaceCoreFrameProps({
    accessMode,
    accountSuccessRedirectHref,
    commands,
    initialJoinCode,
    initialJoinToken,
    planning,
    portalSection,
    requireJoin,
    routeTripId,
    setup,
    t,
  });

  return <WorkspaceAppFrame {...frameProps} />;
}
