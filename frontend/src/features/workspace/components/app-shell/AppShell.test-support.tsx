import type { ReactNode } from "react";
import { vi } from "vitest";
import type { Locale } from "@/src/i18n/types";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { createMemoryStorage } from "@/src/testing/browser-storage";
import { seedTrip } from "@/src/trip/seed";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import type { Member, Trip } from "@/src/trip/types";
import { AppShell } from "./AppShell";

interface RenderAppShellOptions {
  activeView?: PlanningView;
  children?: ReactNode;
  collapsed?: boolean;
  currentMember?: Member;
  locale?: Locale;
  onLeaveParticipantSession?: () => void;
  onNavigateView?: (view: PlanningView, href: string) => void;
  onToggleCollapsed?: () => void;
  trip?: Trip;
}

export function installLocalStorageStub() {
  const storage = createMemoryStorage();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

export function renderAppShell({
  activeView = "overview",
  children = <main>content</main>,
  collapsed = false,
  currentMember = seedTrip.members[0],
  locale = "th",
  onLeaveParticipantSession,
  onNavigateView,
  onToggleCollapsed = vi.fn(),
  trip = seedTrip,
}: RenderAppShellOptions = {}) {
  return renderWithI18n(
    <AppShell
      activeView={activeView}
      collapsed={collapsed}
      currentMember={currentMember}
      onLeaveParticipantSession={onLeaveParticipantSession}
      onNavigateView={onNavigateView}
      onToggleCollapsed={onToggleCollapsed}
      trip={trip}
    >
      {children}
    </AppShell>,
    { locale },
  );
}
