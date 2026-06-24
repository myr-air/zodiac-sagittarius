import { describe, expect, it, vi } from "vitest";
import type { WorkspacePlanningRecordsContext } from "./use-workspace-planning-records-context";
import type { WorkspaceTripPlanCommands } from "./use-workspace-trip-plans";
import { buildWorkspacePlanningContextOutput } from "./workspace-planning-context-output";

function marker(label: string): { label: string } {
  return { label };
}

describe("workspace planning context output", () => {
  it("projects records and trip plan commands into the planning context contract", () => {
    const records = {
      createItineraryNote: vi.fn(),
      createStopNote: vi.fn(),
      createTask: vi.fn(),
      deleteStopNote: vi.fn(),
      expenseSummary: marker("expenseSummary"),
      itineraryView: marker("itineraryView"),
      mainItineraryView: marker("mainItineraryView"),
      replaceWorkspaceRecords: vi.fn(),
      reviewSuggestion: vi.fn(),
      scopedSuggestions: marker("scopedSuggestions"),
      scopedTripForRecords: marker("scopedTripForRecords"),
      scopedTripPlanRecords: marker("scopedTripPlanRecords"),
      selectedDay: "2026-06-19",
      selectedItem: marker("selectedItem"),
      selectedItemIdForView: "item-victoria-peak",
      setStopNotes: vi.fn(),
      setTasks: vi.fn(),
      stopNotes: [],
      suggestSelectedStop: vi.fn(),
      tasks: [],
      toggleTaskStatus: vi.fn(),
      updateStopNote: vi.fn(),
    } as unknown as WorkspacePlanningRecordsContext;
    const tripPlanCommands = {
      createTripPlan: vi.fn(),
      reloadTripPlanConflict: vi.fn(),
      renameTripPlan: vi.fn(),
      selectTripPlan: vi.fn(),
      setMainTripPlan: vi.fn(),
      updateTripPlanStatus: vi.fn(),
    } as unknown as WorkspaceTripPlanCommands;
    const replaceCockpitFromApi = vi.fn();

    const output = buildWorkspacePlanningContextOutput({
      records,
      replaceCockpitFromApi,
      tripPlanCommands,
    });

    expect(output).toMatchObject({
      createItineraryNote: records.createItineraryNote,
      createStopNote: records.createStopNote,
      createTask: records.createTask,
      createTripPlan: tripPlanCommands.createTripPlan,
      deleteStopNote: records.deleteStopNote,
      expenseSummary: records.expenseSummary,
      itineraryView: records.itineraryView,
      mainItineraryView: records.mainItineraryView,
      renameTripPlan: tripPlanCommands.renameTripPlan,
      replaceCockpitFromApi,
      reviewSuggestion: records.reviewSuggestion,
      scopedSuggestions: records.scopedSuggestions,
      scopedTripForRecords: records.scopedTripForRecords,
      scopedTripPlanRecords: records.scopedTripPlanRecords,
      selectTripPlan: tripPlanCommands.selectTripPlan,
      selectedDay: records.selectedDay,
      selectedItem: records.selectedItem,
      selectedItemIdForView: records.selectedItemIdForView,
      setMainTripPlan: tripPlanCommands.setMainTripPlan,
      setStopNotes: records.setStopNotes,
      setTasks: records.setTasks,
      stopNotes: records.stopNotes,
      suggestSelectedStop: records.suggestSelectedStop,
      tasks: records.tasks,
      toggleTaskStatus: records.toggleTaskStatus,
      updateStopNote: records.updateStopNote,
      updateTripPlanStatus: tripPlanCommands.updateTripPlanStatus,
    });
    expect(output).not.toHaveProperty("reloadTripPlanConflict");
    expect(output).not.toHaveProperty("replaceWorkspaceRecords");
  });
});
