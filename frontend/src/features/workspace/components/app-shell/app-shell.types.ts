import type { ReactNode } from "react";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import type { Phase } from "@/src/trip/workspace/phase";
import type { Member, Trip } from "@/src/trip/types";

export type AppShellLeaveSessionHandler = () => void;
export type AppShellNavigationHandler = (view: PlanningView, href: string) => void;
export type AppShellToggleHandler = () => void;

export interface AppShellProps {
  activeView: PlanningView;
  accountPortalHref?: string;
  children: ReactNode;
  collapsed: boolean;
  currentMember: Member;
  onLeaveParticipantSession?: AppShellLeaveSessionHandler;
  onNavigateView?: AppShellNavigationHandler;
  /** Current journey phase. When provided, left rail shows only phase-relevant nav items. */
  phase?: Phase;
  trip: Trip;
  onToggleCollapsed: AppShellToggleHandler;
}

export interface AppShellMemberCardProps {
  accountPortalHref?: string;
  collapsed: boolean;
  currentMember: Member;
  onLeaveParticipantSession?: AppShellLeaveSessionHandler;
}
