import { Icon } from "@/src/ui/icons";
import type { AppShellToggleHandler } from "./app-shell.types";
import {
  brandBlockClassName,
  brandCopyClassName,
  brandMarkClassName,
  brandNameClassName,
  brandRowClassName,
  mobileMenuButtonClassName,
  mobilePageTitleClassName,
  mobileTripNameClassName,
  railToggleClassName,
} from "./AppShell.styles";

interface AppShellBrandHeaderProps {
  activeNavLabel: string;
  collapsed: boolean;
  collapseNavigationLabel: string;
  expandNavigationLabel: string;
  mobileMenuOpen: boolean;
  closeNavigationLabel: string;
  openNavigationLabel: string;
  onToggleCollapsed: AppShellToggleHandler;
  onToggleMobileMenu: AppShellToggleHandler;
  tripName: string;
}

export function AppShellBrandHeader({
  activeNavLabel,
  collapsed,
  collapseNavigationLabel,
  expandNavigationLabel,
  mobileMenuOpen,
  closeNavigationLabel,
  openNavigationLabel,
  onToggleCollapsed,
  onToggleMobileMenu,
  tripName,
}: AppShellBrandHeaderProps) {
  const railToggleLabel = collapsed
    ? expandNavigationLabel
    : collapseNavigationLabel;
  const mobileMenuLabel = mobileMenuOpen
    ? closeNavigationLabel
    : openNavigationLabel;

  return (
    <div
      className={brandRowClassName}
      data-collapsed={collapsed ? "true" : "false"}
    >
      <div className={brandBlockClassName}>
        <div className={brandMarkClassName} aria-hidden="true">
          <Icon name="route" />
        </div>
        <div
          className={brandCopyClassName}
          data-collapsed={collapsed ? "true" : "false"}
        >
          <strong className={brandNameClassName}>Joii</strong>
          <span className={mobileTripNameClassName}>{tripName}</span>
        </div>
      </div>
      <strong className={mobilePageTitleClassName}>{activeNavLabel}</strong>

      <button
        className={railToggleClassName}
        data-collapsed={collapsed ? "true" : "false"}
        type="button"
        aria-expanded={!collapsed}
        aria-label={railToggleLabel}
        onClick={onToggleCollapsed}
        title={railToggleLabel}
      >
        <Icon name={collapsed ? "chevronRight" : "chevronLeft"} />
      </button>
      <button
        className={mobileMenuButtonClassName}
        type="button"
        aria-controls="mobile-workspace-navigation"
        aria-expanded={mobileMenuOpen}
        aria-label={mobileMenuLabel}
        onClick={onToggleMobileMenu}
        title={mobileMenuLabel}
      >
        <Icon name={mobileMenuOpen ? "x" : "menu"} />
      </button>
    </div>
  );
}
