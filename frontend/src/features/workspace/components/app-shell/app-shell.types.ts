import type { ReactNode } from "react";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import type { Member, Trip } from "@/src/trip/types";

export type AppShellLeaveSessionHandler = () => void;
export type AppShellNavigationHandler = (view: PlanningView, href: string) => void;
export type AppShellToggleHandler = () => void;

export interface AppShellProps {
  activeView: PlanningView;
  children: ReactNode;
  collapsed: boolean;
  currentMember: Member;
  onLeaveParticipantSession?: AppShellLeaveSessionHandler;
  onNavigateView?: AppShellNavigationHandler;
  trip: Trip;
  onToggleCollapsed: AppShellToggleHandler;
}

export interface AppShellMemberCardProps {
  collapsed: boolean;
  currentMember: Member;
  onLeaveParticipantSession?: AppShellLeaveSessionHandler;
}
