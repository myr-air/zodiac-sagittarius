import { describe, expect, it } from "vitest";
import { readItineraryArchitectureSource } from "./project-itinerary-architecture.test-support";

describe("Sagittarius itinerary overview architecture contracts", () => {
  it("keeps overview role panels split by reusable panel responsibility", () => {
    const managerRolePanels = readItineraryArchitectureSource("src/features/itinerary/components/overview/ManagerOverviewPanels.tsx");
    const travelerRolePanels = readItineraryArchitectureSource("src/features/itinerary/components/overview/TravelerOverviewPanels.tsx");
    const viewerRolePanels = readItineraryArchitectureSource("src/features/itinerary/components/overview/ViewerOverviewPanels.tsx");
    const managerChecklist = readItineraryArchitectureSource("src/features/itinerary/components/overview/ManagerChecklistPanel.tsx");
    const snapshotPanels = readItineraryArchitectureSource("src/features/itinerary/components/overview/OverviewSnapshotPanels.tsx");
    const rolePanelTypes = readItineraryArchitectureSource("src/features/itinerary/components/overview/overview-role-panels.types.ts");

    expect(managerRolePanels).toContain("./ManagerChecklistPanel");
    expect(managerRolePanels).toContain("./overview-role-panels.types");
    expect(travelerRolePanels).toContain("./TravelerChecklistPanel");
    expect(travelerRolePanels).toContain("./OverviewSnapshotPanels");
    expect(viewerRolePanels).toContain("./OverviewSnapshotPanels");
    expect(managerRolePanels).not.toContain("SegmentedControl");
    expect(travelerRolePanels).not.toContain("interface TravelerOverviewPanelsProps");
    expect(viewerRolePanels).not.toContain("interface ViewerOverviewPanelsProps");
    expect(managerChecklist).toContain("export function ManagerTaskChecklistPanel");
    expect(snapshotPanels).toContain("export function OverviewHighlightsPanel");
    expect(rolePanelTypes).toContain("export interface ManagerOverviewPanelsProps");
  });

  it("keeps overview cockpit cards split from shared overview sections", () => {
    const overviewSections = readItineraryArchitectureSource("src/features/itinerary/components/overview/OverviewSections.tsx");
    const cockpit = readItineraryArchitectureSource("src/features/itinerary/components/overview/OverviewCockpit.tsx");
    const cockpitCard = readItineraryArchitectureSource("src/features/itinerary/components/overview/OverviewCockpitCard.tsx");
    const overviewBarrel = readItineraryArchitectureSource("src/features/itinerary/components/overview/index.ts");

    expect(cockpit).toContain("./OverviewCockpitCard");
    expect(overviewBarrel).toContain('export { CockpitCard } from "./OverviewCockpitCard"');
    expect(overviewSections).not.toContain("export function CockpitCard");
    expect(overviewSections).not.toContain("cockpitCardButtonClassName");
    expect(cockpitCard).toContain("export function CockpitCard");
    expect(cockpitCard).toContain("cockpitCardButtonClassName");
  });

  it("keeps overview task state split from page composition", () => {
    const overviewPage = readItineraryArchitectureSource("src/features/itinerary/components/overview/OverviewPage.tsx");
    const overviewLensPanels = readItineraryArchitectureSource("src/features/itinerary/components/overview/OverviewLensPanels.tsx");
    const overviewPageDerived = readItineraryArchitectureSource("src/features/itinerary/components/overview/overview-page-derived.tsx");
    const overviewPageTypes = readItineraryArchitectureSource("src/features/itinerary/components/overview/OverviewPage.types.ts");
    const overviewTaskState = readItineraryArchitectureSource("src/features/itinerary/components/overview/use-overview-task-state.ts");

    expect(overviewPage).toContain("./use-overview-task-state");
    expect(overviewPage).toContain("./OverviewPage.types");
    expect(overviewPage).toContain("./OverviewLensPanels");
    expect(overviewPage).toContain("./overview-page-derived");
    expect(overviewPage).not.toContain("./ManagerOverviewPanels");
    expect(overviewPage).not.toContain("./TravelerOverviewPanels");
    expect(overviewPage).not.toContain("./ViewerOverviewPanels");
    expect(overviewPage).not.toContain("useState");
    expect(overviewPage).not.toContain("useMemo");
    expect(overviewPage).not.toContain("interface OverviewPageProps");
    expect(overviewPage).not.toContain("function submitTask");
    expect(overviewPage).not.toContain("isMyTask");
    expect(overviewLensPanels).toContain("export function OverviewLensPanels");
    expect(overviewLensPanels).toContain("./ManagerOverviewPanels");
    expect(overviewLensPanels).toContain("./TravelerOverviewPanels");
    expect(overviewLensPanels).toContain("./ViewerOverviewPanels");
    expect(overviewPageDerived).toContain("export function renderOverviewCurrentMemberCard");
    expect(overviewPageDerived).toContain("export function buildOverviewTaskListLabels");
    expect(overviewPageTypes).toContain("export interface OverviewPageProps");
    expect(overviewTaskState).toContain("export function useOverviewTaskState");
    expect(overviewTaskState).toContain("function submitTask");
    expect(overviewTaskState).toContain("isMyTask");
    expect(overviewTaskState).toContain("myOpenTasks");
    expect(overviewTaskState).toContain("sharedOpenTasks");
  });
});
