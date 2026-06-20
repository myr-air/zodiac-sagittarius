import { useI18n } from "@/src/i18n/I18nProvider";
import {
  contextRailTabValues,
  type ContextRailTab,
} from "./context-rail.utils";
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
      {contextRailTabValues.map((tab) => (
        <button
          className={inspectorTabClassName}
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => onActiveTabChange(tab)}
        >
          {t.contextRail.tabs[tab]}
        </button>
      ))}
    </div>
  );
}
