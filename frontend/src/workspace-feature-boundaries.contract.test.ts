import { describe, expect, it } from "vitest";
import { frontendRoot } from "./project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace feature source boundaries", () => {
  it("keeps workspace frame, settings, members, and shared inputs split by responsibility", () => {
    const {
      sagaCore,
      itineraryTimeLib,
      tripSettingsPageSource,
      tripSettingsIndexSource,
      memberSupport,
      dateTimePickers,
      tripSettingsPage,
      tripSettingsSupport,
      tripSettingsFormState,
      selectedTripPlanHookTest,
      selectedTripPlanTest,
      selectedTripPlanTestFixtures,
      workspaceCoreFrameProps,
      workspaceCoreRecordProps,
      workspaceFrameProps,
      workspaceFrameActionProps,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(sagaCore).toContain("buildWorkspaceCoreFrameProps");
    expect(sagaCore).not.toContain("buildWorkspaceFrameActionProps");
    expect(workspaceCoreFrameProps).toContain("buildWorkspaceFrameProps");
    expect(workspaceCoreFrameProps).toContain("buildWorkspaceCoreRecordProps");
    expect(workspaceCoreRecordProps).toContain("bookingDocs:");
    expect(workspaceCoreRecordProps).toContain("tasks:");
    expect(workspaceFrameProps).toContain("buildWorkspaceFrameActionProps");
    expect(sagaCore).not.toContain("void createItineraryNote(itemId, body)");
    expect(workspaceFrameActionProps).toContain("onAddNoteForItem");
    expect(workspaceFrameActionProps).toContain("onTransferOwnership");
    expect(itineraryTimeLib).toContain("@/src/trip/itinerary-time");
    expect(itineraryTimeLib).not.toContain("/^(\\d{2}):(\\d{2})$/");

    expect(tripSettingsPageSource).not.toContain("export interface TripSettingsFormValues");
    expect(tripSettingsIndexSource).toContain("./TripSettingsPage.types");
    expect(memberSupport).toContain("@/src/routes/invite-links");
    expect(memberSupport).not.toContain("function buildInviteLink");
    expect(dateTimePickers).toContain("./DatePickerField");
    expect(dateTimePickers).toContain("./DateTimePickerField");
    expect(dateTimePickers).toContain("./TimePickerField");
    expect(dateTimePickers).not.toContain("function CalendarContent");
    expect(dateTimePickers).not.toContain("function TimePickerContent");
    expect(dateTimePickers).not.toContain("createPortal");
    expect(tripSettingsPage).toContain("./TripSettingsPage.support");
    expect(tripSettingsPage).toContain("./use-trip-settings-form-state");
    expect(tripSettingsSupport).toContain("@/src/trip/itinerary-time");
    expect(tripSettingsPage).not.toContain("function daysBetweenIsoDates");
    expect(tripSettingsPage).not.toContain("function shiftIsoDate");
    expect(tripSettingsPage).not.toContain("useState");
    expect(tripSettingsPage).not.toContain("normalizeTripSettingsForm");
    expect(tripSettingsSupport).not.toContain("function daysBetweenIsoDates");
    expect(tripSettingsSupport).not.toContain("function shiftIsoDate");
    expect(tripSettingsFormState).toContain("useTripSettingsFormState");
    expect(tripSettingsFormState).toContain("normalizeTripSettingsForm");
    expect(selectedTripPlanHookTest).toContain("selected-trip-plan.test-fixtures");
    expect(selectedTripPlanHookTest).not.toContain("function tripWithPlans");
    expect(selectedTripPlanTest).toContain("./selected-trip-plan.test-fixtures");
    expect(selectedTripPlanTest).not.toContain("function tripWithPlans");
    expect(selectedTripPlanTestFixtures).toContain("export function tripWithPlans");
    expect(selectedTripPlanTestFixtures).toContain("export function tripWithOnlyMainPlan");
  });
});
