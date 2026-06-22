import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  activityCellActionsExpandedState,
  activityCellNoteTargetState,
  activityCellSubActivitiesToggledState,
  activityCellSubActivityModalState,
  initialActivityCellUiState,
} from "../activity-cell-ui-state";

const item = tripFixture.planItems[0];

describe("activity cell ui state", () => {
  it("centralizes the default activity cell ui state", () => {
    expect(initialActivityCellUiState()).toEqual({
      actionsExpanded: false,
      noteTarget: null,
      subActivitiesExpanded: false,
      subActivityModalOpen: false,
    });
  });

  it("updates actions, note target, and sub-activity modal state", () => {
    const expanded = activityCellActionsExpandedState(
      initialActivityCellUiState(),
      true,
    );
    const withNote = activityCellNoteTargetState(expanded, item, true);
    const withModal = activityCellSubActivityModalState(withNote, true, true);

    expect(withNote).toEqual(expect.objectContaining({
      actionsExpanded: false,
      noteTarget: item,
    }));
    expect(withModal).toEqual(expect.objectContaining({
      actionsExpanded: false,
      subActivityModalOpen: true,
    }));
  });

  it("toggles sub-activities and closes compact actions when requested", () => {
    const expanded = activityCellActionsExpandedState(
      initialActivityCellUiState(),
      true,
    );
    const toggled = activityCellSubActivitiesToggledState(expanded, true);

    expect(toggled).toEqual(expect.objectContaining({
      actionsExpanded: false,
      subActivitiesExpanded: true,
    }));
    expect(activityCellSubActivitiesToggledState(toggled)).toEqual(
      expect.objectContaining({
        subActivitiesExpanded: false,
      }),
    );
  });
});
