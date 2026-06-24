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
      memberCopyFeedback,
      expenseCopyFeedback,
      memberPageOptions,
      memberPageSelectors,
      photoCopyFeedback,
      bookingExternalLinkAction,
      dateTimePickers,
      tripSettingsPage,
      tripSettingsStateKey,
      tripSettingsFormModel,
      tripSettingsDateImpact,
      tripSettingsFormActions,
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
    expect(itineraryTimeLib).toContain("@/src/shared/date-time-local");
    expect(itineraryTimeLib).not.toContain("/^(\\d{2}):(\\d{2})$/");
    expect(itineraryTimeLib).not.toContain("export function");
    expect(itineraryTimeLib).not.toContain("coreDurationBetweenTimes");
    expect(itineraryTimeLib).not.toContain("coreEndOffsetDaysBetweenTimes");
    expect(itineraryTimeLib).not.toContain("coreMinutesToTime");
    expect(itineraryTimeLib).not.toContain("Math.max(1, duration)");

    expect(tripSettingsPageSource).not.toContain("export interface TripSettingsFormValues");
    expect(tripSettingsTypesSource).toContain("export interface TripSettingsFormValues");
    expect(tripSettingsPageTypesSource).toContain("export type { TripSettingsFormValues }");
    expect(tripSettingsPageTypesSource).not.toContain("export interface TripSettingsFormValues");
    expect(memberInviteActions).toContain("@/src/routes/invite-links");
    expect(memberInviteActions).not.toContain("./TripMembersPage.support");
    [memberCopyFeedback, expenseCopyFeedback, photoCopyFeedback].forEach(
      (source) => {
        expect(source).toContain("WorkspaceCopyFeedback");
        expect(source).toContain("workspaceCopyFeedbackLabel");
        expect(source).toContain("CopyFeedbackLabels");
      },
    );
    expect(memberCopyFeedback).toContain("memberCopyFeedbackLabels");
    expect(memberCopyFeedback).toContain("labels.members.copy");
    expect(memberCopyFeedback).toContain("readOnly");
    expect(expenseCopyFeedback).toContain("expenseCopyFeedbackLabels");
    expect(expenseCopyFeedback).toContain("t.expenses.copy");
    expect(expenseCopyFeedback).toContain("aria-label={t.expenses.copy.statusLabel}");
    expect(photoCopyFeedback).toContain("photoCopyFeedbackLabels");
    expect(photoCopyFeedback).toContain("PhotoCopy");
    expect(photoCopyFeedback).toContain("aria-label={copy.copyStatusLabel}");
    expect(bookingExternalLinkAction).toContain("BookingDoc");
    expect(bookingExternalLinkAction).toContain("ExternalLinkAction");
    expect(bookingExternalLinkAction).toContain("openLabel");
    expect(bookingExternalLinkAction).toContain("variant === \"icon\"");
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
    expect(tripSettingsPage).toContain("./hooks/use-trip-settings-form-state");
    expect(tripSettingsPage).not.toContain("function daysBetweenIsoDates");
    expect(tripSettingsPage).not.toContain("function shiftIsoDate");
    expect(tripSettingsPage).not.toContain("useState");
    expect(tripSettingsPage).not.toContain("normalizeTripSettingsForm");
    expect(tripSettingsStateKey).toContain("export function tripSettingsStateKey");
    expect(tripSettingsFormModel).toContain("export function normalizeTripSettingsForm");
    expect(tripSettingsFormModel).toContain("export function canSubmitTripSettings");
    expect(tripSettingsDateImpact).toContain("@/src/trip/itinerary-core");
    expect(tripSettingsDateImpact).toContain("export function countStopsOutsideSettingsRange");
    expect(tripSettingsFormActions).toContain("useTripSettingsFormActions");
    expect(tripSettingsFormActions).toContain("normalizeTripSettingsForm");
    expect(tripSettingsFormActions).toContain("savingTripSettingsFormState");
    expect(tripSettingsFormActions).toContain("savedTripSettingsFormState");
    expect(tripSettingsFormActions).toContain("failedTripSettingsFormState");
    expect(tripSettingsFormState).toContain("useTripSettingsFormState");
    expect(tripSettingsFormState).toContain("useTripSettingsFormActions");
    expect(tripSettingsFormState).not.toContain("normalizeTripSettingsForm");
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
