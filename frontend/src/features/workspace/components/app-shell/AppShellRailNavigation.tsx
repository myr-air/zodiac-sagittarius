import type { Dispatch, RefObject, SetStateAction } from "react";
import { cn } from "@/src/lib/cn";
import type { tripWorkspaceNavItems } from "@/src/routes/app-routes";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import { Icon } from "@/src/ui/icons";
import type { AppShellNavigationHandler } from "./app-shell.types";
import {
  activeRailLinkClassName,
  railLinkClassName,
  railLinkLabelClassName,
  railLinksClassName,
} from "./AppShell.styles";

type AppShellNavItem = ReturnType<typeof tripWorkspaceNavItems>[number];

interface AppShellRailNavigationProps {
  activeLinkRef: RefObject<HTMLAnchorElement | null>;
  activeView: PlanningView;
  collapsed: boolean;
  mobileMenuOpen: boolean;
  navItems: AppShellNavItem[];
  onNavigateView?: AppShellNavigationHandler;
  settingsHref: string;
  settingsLabel: string;
  settingsView: PlanningView;
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
}

export function AppShellRailNavigation({
  activeLinkRef,
  activeView,
  collapsed,
  mobileMenuOpen,
  navItems,
  onNavigateView,
  settingsHref,
  settingsLabel,
  settingsView,
  setMobileMenuOpen,
}: AppShellRailNavigationProps) {
  return (
    <div
      className={railLinksClassName}
      data-mobile-open={mobileMenuOpen ? "true" : "false"}
      id="mobile-workspace-navigation"
    >
      {navItems.map((item) => (
        <AppShellRailLink
          activeLinkRef={activeLinkRef}
          activeView={activeView}
          collapsed={collapsed}
          href={item.href}
          icon={item.icon}
          key={item.id}
          label={item.label}
          onNavigateView={onNavigateView}
          setMobileMenuOpen={setMobileMenuOpen}
          view={item.id}
        />
      ))}
      <AppShellRailLink
        activeLinkRef={activeLinkRef}
        activeView={activeView}
        collapsed={collapsed}
        href={settingsHref}
        icon="settings"
        label={settingsLabel}
        onNavigateView={onNavigateView}
        setMobileMenuOpen={setMobileMenuOpen}
        view={settingsView}
      />
    </div>
  );
}

interface AppShellRailLinkProps {
  activeLinkRef: RefObject<HTMLAnchorElement | null>;
  activeView: PlanningView;
  collapsed: boolean;
  href: string;
  icon: AppShellNavItem["icon"];
  label: string;
  onNavigateView?: AppShellNavigationHandler;
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
  view: PlanningView;
}

function AppShellRailLink({
  activeLinkRef,
  activeView,
  collapsed,
  href,
  icon,
  label,
  onNavigateView,
  setMobileMenuOpen,
  view,
}: AppShellRailLinkProps) {
  const isActive = view === activeView;

  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={cn(railLinkClassName, isActive && activeRailLinkClassName)}
      data-collapsed={collapsed ? "true" : "false"}
      data-active={isActive ? "true" : "false"}
      href={href}
      key={view}
      onClick={
        onNavigateView
          ? (event) => {
              event.preventDefault();
              setMobileMenuOpen(false);
              onNavigateView(view, href);
            }
          : undefined
      }
      ref={isActive ? activeLinkRef : undefined}
      title={label}
    >
      <Icon name={icon} />
      <span
        className={railLinkLabelClassName}
        data-collapsed={collapsed ? "true" : "false"}
      >
        {label}
      </span>
    </a>
  );
}
