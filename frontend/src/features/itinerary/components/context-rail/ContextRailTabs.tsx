import { useI18n } from "@/src/i18n/I18nProvider";
import { ContextRailTab } from "./context-rail.utils";
import {
  inspectorTabClassName,
  inspectorTabsClassName,
} from "./context-rail.styles";

export function ContextRailTabs({
  activeTab,
  onActiveTabChange,
}: {
  activeTab: ContextRailTab;
  onActiveTabChange: (tab: ContextRailTab) => void;
}) {
  const { t } = useI18n();

  return (
    <div
      className={inspectorTabsClassName}
      role="tablist"
      aria-label={t.contextRail.tabsLabel}
    >
      <button
        className={inspectorTabClassName}
        type="button"
        role="tab"
        aria-selected={activeTab === "notes"}
        onClick={() => onActiveTabChange("notes")}
      >
        {t.contextRail.tabs.notes}
      </button>
      <button
        className={inspectorTabClassName}
        type="button"
        role="tab"
        aria-selected={activeTab === "booking"}
        onClick={() => onActiveTabChange("booking")}
      >
        {t.contextRail.tabs.booking}
      </button>
      <button
        className={inspectorTabClassName}
        type="button"
        role="tab"
        aria-selected={activeTab === "suggestions"}
        onClick={() => onActiveTabChange("suggestions")}
      >
        {t.contextRail.tabs.suggestions}
      </button>
    </div>
  );
}
