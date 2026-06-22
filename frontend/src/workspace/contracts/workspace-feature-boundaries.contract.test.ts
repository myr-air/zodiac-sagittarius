import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace feature source boundaries", () => {
  it("keeps workspace frame, settings, members, and shared inputs split by responsibility", () => {
    const {
      sagaCore,
      itineraryTimeLib,
      tripSettingsPageSource,
      tripSettingsTypesSource,
      tripSettingsPageTypesSource,
      memberInviteActions,
      memberPageOptions,
      memberPageSelectors,
      dateTimePickers,
      tripSettingsPage,
      tripSettingsStateKey,
      tripSettingsFormModel,
      tripSettingsDateImpact,
      tripSettingsFormState,
      selectedTripPlanHookTest,
      selectedTripPlanTest,
      selectedTripPlanTestFixtures,
      workspaceCoreCommandProps,
      workspaceCoreFrameProps,
      workspaceCoreRecordProps,
      workspaceFrameProps,
      workspaceFrameActionProps,
      workspaceCoreAppCommandProps,
      workspaceCorePlanningCommandProps,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(sagaCore).toContain("buildWorkspaceCoreFrameProps");
    expect(sagaCore).not.toContain("buildWorkspaceFrameActionProps");
    expect(workspaceCoreFrameProps).toContain("buildWorkspaceFrameProps");
    expect(workspaceCoreFrameProps).toContain("buildWorkspaceCoreCommandProps");
    expect(workspaceCoreFrameProps).toContain("buildWorkspaceCoreRecordProps");
    expect(workspaceCoreCommandProps).toContain("buildWorkspaceCoreAppCommandProps");
    expect(workspaceCoreCommandProps).toContain("buildWorkspaceCorePlanningCommandProps");
    expect(workspaceCoreCommandProps).toContain("buildWorkspaceCoreSetupCommandProps");
    expect(workspaceCoreCommandProps).not.toContain("onAddStop:");
    expect(workspaceCoreAppCommandProps).toContain("onAddStop:");
    expect(workspaceCoreAppCommandProps).toContain("onSaveTripSettings");
    expect(workspaceCorePlanningCommandProps).toContain("toggleTaskStatus");
    expect(workspaceCoreFrameProps).not.toContain("onAddStop:");
    expect(workspaceCoreRecordProps).toContain("bookingDocs:");
    expect(workspaceCoreRecordProps).toContain("tasks:");
    expect(workspaceFrameProps).toContain("buildWorkspaceFrameActionProps");
    expect(sagaCore).not.toContain("void createItineraryNote(itemId, body)");
    expect(workspaceFrameActionProps).toContain("onAddNoteForItem");
    expect(workspaceFrameActionProps).toContain("onTransferOwnership");
    expect(itineraryTimeLib).toContain("@/src/trip/itinerary-core");
    expect(itineraryTimeLib).not.toContain("/^(\\d{2}):(\\d{2})$/");
    expect(itineraryTimeLib).toContain("coreDurationBetweenTimes");
    expect(itineraryTimeLib).toContain("coreEndOffsetDaysBetweenTimes");
    expect(itineraryTimeLib).toContain("coreMinutesToTime");
    expect(itineraryTimeLib).not.toContain("Math.max(1, duration)");

    expect(tripSettingsPageSource).not.toContain("export interface TripSettingsFormValues");
    expect(tripSettingsTypesSource).toContain("export interface TripSettingsFormValues");
    expect(tripSettingsPageTypesSource).toContain("export type { TripSettingsFormValues }");
    expect(tripSettingsPageTypesSource).not.toContain("export interface TripSettingsFormValues");
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
    expect(tripSettingsPage).toContain("./model/trip-settings-state-key");
    expect(tripSettingsPage).toContain("./use-trip-settings-form-state");
    expect(tripSettingsPage).not.toContain("function daysBetweenIsoDates");
    expect(tripSettingsPage).not.toContain("function shiftIsoDate");
    expect(tripSettingsPage).not.toContain("useState");
    expect(tripSettingsPage).not.toContain("normalizeTripSettingsForm");
    expect(tripSettingsStateKey).toContain("export function tripSettingsStateKey");
    expect(tripSettingsFormModel).toContain("export function normalizeTripSettingsForm");
    expect(tripSettingsFormModel).toContain("export function canSubmitTripSettings");
    expect(tripSettingsDateImpact).toContain("@/src/trip/itinerary-core");
    expect(tripSettingsDateImpact).toContain("export function countStopsOutsideSettingsRange");
    expect(tripSettingsFormState).toContain("useTripSettingsFormState");
    expect(tripSettingsFormState).toContain("normalizeTripSettingsForm");
    expect(tripSettingsFormState).toContain("initialTripSettingsFormState");
    expect(tripSettingsFormState).toContain("const [state, setState]");
    expect(tripSettingsFormState).not.toContain("const [form, setForm]");
    expect(tripSettingsFormState).not.toContain("const [status, setStatus]");
    expect(tripSettingsFormState).not.toContain("const [error, setError]");
    expect(selectedTripPlanHookTest).toContain("testing/fixtures/selected-trip-plan-fixtures");
    expect(selectedTripPlanHookTest).not.toContain("function tripWithPlans");
    expect(selectedTripPlanTest).toContain("../testing/fixtures/selected-trip-plan-fixtures");
    expect(selectedTripPlanTest).not.toContain("function tripWithPlans");
    expect(selectedTripPlanTestFixtures).toContain("export function tripWithPlans");
    expect(selectedTripPlanTestFixtures).toContain("export function tripWithOnlyMainPlan");
  });
});
