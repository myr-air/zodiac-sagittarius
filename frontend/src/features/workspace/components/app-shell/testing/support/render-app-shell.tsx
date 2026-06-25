import type { ReactNode } from "react";
import { vi } from "vitest";
import type { Locale } from "@/src/i18n/types";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { AppShell } from "../../AppShell";
import type { AppShellProps } from "../../app-shell.types";

type RenderAppShellOptions = Partial<Omit<AppShellProps, "children">> & {
  children?: ReactNode;
  locale?: Locale;
};

export function renderAppShell({
  accountPortalHref,
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
      accountPortalHref={accountPortalHref}
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
