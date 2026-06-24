import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace planning hook source boundaries", () => {
  it("keeps planning state, records, view-model, and selected-plan hooks split by responsibility", () => {
    const {
      sagaCore,
      workspaceContextsHook,
      workspaceTripPlansHook,
      tripPlanMutationCommands,
      tripPlanCommandTypes,
      tripPlanCreateCommand,
      tripPlanMainCommand,
      tripPlanPatchCommands,
      workspaceTripPlanSelection,
      itineraryViewModelHook,
      setupContextHook,
      backendExpenseSummaryHook,
      cockpitReplacementHook,
      dataContextHook,
      planningContextHook,
      planningRecordsContextHook,
      selectedTripPlanHook,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(sagaCore).toContain("useSagittariusWorkspaceContexts");
    expect(workspaceContextsHook).toContain("useWorkspacePlanningContext");
    expect(sagaCore).not.toContain("useWorkspaceCockpitReplacement");
    expect(sagaCore).not.toContain("normalizeTripPlanAliases");
    expect(cockpitReplacementHook).toContain("export function useWorkspaceCockpitReplacement");
    expect(cockpitReplacementHook).toContain("normalizeTripPlanAliases");
    expect(cockpitReplacementHook).toContain("resetBackendExpenseSummary");
    expect(planningContextHook).toContain("useWorkspaceCockpitReplacement");
    expect(planningContextHook).toContain("useWorkspacePlanningRecordsContext");
    expect(planningContextHook).not.toContain("useWorkspaceItineraryViewModel");
    expect(planningContextHook).not.toContain("useWorkspaceRecords");
    expect(planningRecordsContextHook).toContain("useWorkspaceItineraryViewModel");
    expect(planningRecordsContextHook).toContain("useWorkspaceRecords");
    expect(planningRecordsContextHook).toContain("useTripWorkspaceRecords");
    expect(planningContextHook).toContain("useWorkspaceTripPlanCommands");
    expect(planningContextHook).toContain("useWorkspaceApiCockpitEffects");
    expect(sagaCore).not.toContain("useWorkspaceItineraryViewModel");
    expect(sagaCore).not.toContain("buildItineraryView");
    expect(sagaCore).not.toContain("resolveSelectedWorkspaceItem");
    expect(itineraryViewModelHook).toContain("buildItineraryView");
    expect(itineraryViewModelHook).toContain("resolveSelectedWorkspaceItem");
    expect(sagaCore).not.toContain("useWorkspaceSelectedTripPlanState");
    expect(setupContextHook).toContain("useWorkspaceSelectedTripPlanState");
    expect(sagaCore).not.toContain("useWorkspaceSelectedTripPlanSync");
    expect(planningContextHook).toContain("useWorkspaceSelectedTripPlanSync");
    expect(sagaCore).not.toContain("queueMicrotask");
    expect(selectedTripPlanHook).toContain("queueMicrotask");
    expect(selectedTripPlanHook).toContain("rememberSelectedTripPlanId");
    expect(selectedTripPlanHook).toContain("resolveSelectedTripPlanId");
    expect(sagaCore).not.toContain("@/src/trip/workspace/selected-trip-plan");
    expect(planningContextHook).toContain("@/src/trip/workspace/selected-trip-plan");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-backend-expense-summary");
    expect(backendExpenseSummaryHook).toContain("@/src/trip/workspace/use-backend-expense-summary");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-daily-briefings");
    expect(dataContextHook).toContain("@/src/trip/workspace/use-daily-briefings");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-itinerary-path-workspace");
    expect(setupContextHook).toContain("@/src/trip/workspace/use-itinerary-path-workspace");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-trip-workspace-records");
    expect(planningContextHook).not.toContain("@/src/trip/workspace/use-trip-workspace-records");
    expect(planningRecordsContextHook).toContain("@/src/trip/workspace/use-trip-workspace-records");
    expect(workspaceTripPlansHook).toContain("canSelectWorkspaceTripPlan");
    expect(workspaceTripPlansHook).toContain("resolveReloadedTripPlanSelection");
    expect(tripPlanMutationCommands).toContain("useWorkspaceTripPlanCreateCommand");
    expect(tripPlanMutationCommands).toContain("useWorkspaceTripPlanMainCommand");
    expect(tripPlanMutationCommands).toContain("useWorkspaceTripPlanPatchCommands");
    expect(tripPlanMutationCommands).not.toContain("buildSetMainTripPlanRequest");
    expect(tripPlanMutationCommands).not.toContain("setLocalMainTripPlan");
    expect(tripPlanCommandTypes).toContain(
      "UseWorkspaceTripPlanMutationCommandsParams",
    );
    expect(tripPlanCreateCommand).toContain("buildCreateTripPlanRequest");
    expect(tripPlanMainCommand).toContain("buildSetMainTripPlanRequest");
    expect(tripPlanMainCommand).toContain("setLocalMainTripPlan");
    expect(tripPlanPatchCommands).toContain("buildPatchTripPlanStatusRequest");
    expect(tripPlanPatchCommands).toContain("buildRenameTripPlanRequest");
    expect(workspaceTripPlanSelection).toContain("planVariants.some");
  });
});
