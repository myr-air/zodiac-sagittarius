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
      memberInviteActions,
      memberPageOptions,
      memberPageSelectors,
      dateTimePickers,
      tripSettingsPage,
      tripSettingsSupport,
      tripSettingsFormState,
      selectedTripPlanHookTest,
      selectedTripPlanTest,
      selectedTripPlanTestFixtures,
      workspaceCoreCommandProps,
      workspaceCoreFrameProps,
      workspaceCoreRecordProps,
      workspaceFrameProps,
      workspaceFrameActionProps,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(sagaCore).toContain("buildWorkspaceCoreFrameProps");
    expect(sagaCore).not.toContain("buildWorkspaceFrameActionProps");
    expect(workspaceCoreFrameProps).toContain("buildWorkspaceFrameProps");
    expect(workspaceCoreFrameProps).toContain("buildWorkspaceCoreCommandProps");
    expect(workspaceCoreFrameProps).toContain("buildWorkspaceCoreRecordProps");
    expect(workspaceCoreCommandProps).toContain("onAddStop:");
    expect(workspaceCoreCommandProps).toContain("onSaveTripSettings");
    expect(workspaceCoreFrameProps).not.toContain("onAddStop:");
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
    expect(memberInviteActions).toContain("@/src/routes/invite-links");
    expect(memberInviteActions).not.toContain("./TripMembersPage.support");
    expect(memberPageOptions).toContain("export const memberRoleFilterValues");
    expect(memberPageOptions).toContain("export const memberStatusFilterValues");
    expect(memberPageSelectors).toContain("export function filterTripMembers");
    expect(memberPageSelectors).toContain("export function visibleTripMembers");
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
