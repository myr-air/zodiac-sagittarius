import { describe, expect, it } from "vitest";
import { readItineraryArchitectureSource } from "./project-itinerary-architecture.test-support";

describe("Sagittarius itinerary view prop architecture contracts", () => {
  it("keeps reusable view prop contracts outside component bodies", () => {
    const timelineView = readItineraryArchitectureSource("src/features/itinerary/components/TimelineView.tsx");
    const timelineViewTypes = readItineraryArchitectureSource("src/features/itinerary/components/TimelineView.types.ts");
    const componentBarrel = readItineraryArchitectureSource("src/features/itinerary/components/index.ts");
    const workspaceViews = readItineraryArchitectureSource("src/trip/workspace/TripWorkspaceViews.tsx");

    expect(timelineView).toContain("./TimelineView.types");
    expect(timelineView).not.toContain("interface TimelineViewProps");
    expect(timelineViewTypes).toContain("export interface TimelineViewProps");
    expect(componentBarrel).toContain("export type { SmartItineraryTableProps }");
    expect(componentBarrel).toContain("export type { TimelineViewProps }");
    expect(workspaceViews).not.toContain("ComponentProps<typeof SmartItineraryTable>");
    expect(workspaceViews).not.toContain("ComponentProps<typeof OverviewPage>");
    expect(workspaceViews).not.toContain("ComponentProps<typeof TimelineView>");
  });
});
