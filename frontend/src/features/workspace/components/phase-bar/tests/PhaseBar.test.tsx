import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhaseBar } from "../PhaseBar";
import { PHASE_ORDER } from "../../../../../trip/workspace/phase";
import { I18nProvider } from "../../../../../i18n/I18nProvider";

function renderPhaseBar(props: Partial<Parameters<typeof PhaseBar>[0]> = {}) {
  return render(
    <I18nProvider>
      <PhaseBar
        phases={PHASE_ORDER}
        currentPhase="dreamer"
        onPhaseChange={vi.fn()}
        {...props}
      />
    </I18nProvider>,
  );
}

describe("PhaseBar", () => {
  it("renders 6 phase tabs", () => {
    renderPhaseBar();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(6);
  });

  it("marks the current phase as selected", () => {
    renderPhaseBar({ currentPhase: "route-builder" });
    const tab = screen.getByRole("tab", { selected: true });
    expect(tab).toBeInTheDocument();
  });

  it("calls onPhaseChange when clicking an available tab", async () => {
    const onPhaseChange = vi.fn();
    const user = userEvent.setup();
    renderPhaseBar({ onPhaseChange, currentPhase: "dreamer" });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[1]);
    expect(onPhaseChange).toHaveBeenCalledWith("flexible-hunter");
  });

  it("does not call onPhaseChange when clicking an unavailable tab", async () => {
    const onPhaseChange = vi.fn();
    const user = userEvent.setup();
    renderPhaseBar({
      onPhaseChange,
      currentPhase: "dreamer",
      unavailablePhases: new Set(["flexible-hunter"]),
    });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[1]);
    expect(onPhaseChange).not.toHaveBeenCalled();
  });

  it("marks unavailable tabs with aria-disabled", () => {
    renderPhaseBar({
      unavailablePhases: new Set(["group-wrangler", "on-trip-companion"]),
    });
    const disabledTabs = screen.getAllByRole("tab").filter(
      (tab) => tab.getAttribute("aria-disabled") === "true",
    );
    expect(disabledTabs).toHaveLength(2);
  });

  it("has accessible tablist with role and label", () => {
    renderPhaseBar();
    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveAttribute("aria-label", "Journey phases");
  });

  it("renders an icon in each tab", () => {
    renderPhaseBar();
    const tabs = screen.getAllByRole("tab");
    tabs.forEach((tab) => {
      // The Icon component renders an SVG with class "icon"
      const icon = tab.querySelector("svg.icon");
      expect(icon).toBeInTheDocument();
    });
  });

  it("active tab has aria-selected true", () => {
    renderPhaseBar({ currentPhase: "detail-planner" });
    const activeTab = screen.getByRole("tab", { selected: true });
    expect(activeTab.getAttribute("aria-selected")).toBe("true");
  });
});
