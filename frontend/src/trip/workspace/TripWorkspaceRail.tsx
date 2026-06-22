"use client";

import { ContextRail } from "@/src/features/itinerary/components";
import type { ContextRailProps } from "@/src/features/itinerary/components";

export interface TripWorkspaceRailProps {
  enabled: boolean;
  mounted: boolean;
  railProps: ContextRailProps;
}

export function TripWorkspaceRail({
  enabled,
  mounted,
  railProps,
}: TripWorkspaceRailProps) {
  if (!enabled || !mounted) return null;
  return <ContextRail {...railProps} />;
}
