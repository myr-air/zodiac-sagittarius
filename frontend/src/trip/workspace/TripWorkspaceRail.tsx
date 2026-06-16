"use client";

import type { ComponentProps } from "react";
import { ContextRail } from "@/src/features/itinerary/components";

type ContextRailProps = ComponentProps<typeof ContextRail>;

interface TripWorkspaceRailProps {
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
