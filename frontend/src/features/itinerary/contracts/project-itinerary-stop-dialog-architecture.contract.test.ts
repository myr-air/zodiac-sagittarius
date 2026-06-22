import { describe, expect, it } from "vitest";
import { readItineraryArchitectureSource } from "./project-itinerary-architecture.test-support";

describe("Sagittarius itinerary stop-dialog architecture contracts", () => {
  it("keeps StopDialog render split from form model state", () => {
    const stopDialog = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/StopDialog.tsx");
    const stopDialogFormFields = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/StopDialogFormFields.tsx");
    const stopDialogModel = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/use-stop-dialog-model.ts");
    const stopDialogDraftState = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/stop-dialog-draft-state.ts");
    const stopDialogTypes = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/stop-dialog.types.ts");
    const stopDialogCopy = readItineraryArchitectureSource("src/features/itinerary/domain/stop-dialog-copy.ts");
    const stopDialogTimeWindow = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/StopDialogTimeWindow.tsx");

    expect(stopDialog).toContain("./use-stop-dialog-model");
    expect(stopDialog).toContain("./StopDialogFormFields");
    expect(stopDialog).not.toContain("useState");
    expect(stopDialog).not.toContain("interface StopDialogProps");
    expect(stopDialog).not.toContain("buildStopSubmitValues");
    expect(stopDialog).not.toContain("applyStopActivityInput");
    expect(stopDialog).not.toContain("StopDialogPrimaryFields");
    expect(stopDialog).not.toContain('locale === "th"');
    expect(stopDialogFormFields).not.toContain('locale === "th"');
    expect(stopDialogTimeWindow).not.toContain('locale === "th"');
    expect(stopDialog).toContain("@/src/features/itinerary/domain/stop-dialog-copy");
    expect(stopDialogFormFields).toContain("stopDialogCopy");
    expect(stopDialogTimeWindow).toContain("timeWindowCopy");
    expect(stopDialogFormFields).toContain("export function StopDialogFormFields");
    expect(stopDialogFormFields).toContain("StopDialogPrimaryFields");
    expect(stopDialogFormFields).toContain("StopDialogPlaceResolution");
    expect(stopDialogModel).toContain("export function useStopDialogModel");
    expect(stopDialogModel).toContain("./stop-dialog-draft-state");
    expect(stopDialogModel).toContain("./stop-dialog-submit-state");
    expect(stopDialogModel).toContain("const [draftState, setDraftState]");
    expect(stopDialogModel).toContain("const [submitState, setSubmitState]");
    expect(stopDialogModel).not.toContain("const [values, setValues]");
    expect(stopDialogModel).not.toContain("const [detailType, setDetailType]");
    expect(stopDialogModel).not.toContain("const [detailValues, setDetailValues]");
    expect(stopDialogModel).not.toContain("useState<PlaceResolutionCandidate>");
    expect(stopDialogDraftState).toContain("export interface StopDialogDraftState");
    expect(stopDialogDraftState).toContain("@/src/features/itinerary/domain/stop-form-model");
    expect(stopDialogDraftState).toContain("buildStopDialogDraftSubmitValues");
    expect(stopDialogDraftState).toContain("updateStopDialogActivity");
    expect(stopDialogModel).not.toContain("./stop-dialog.form");
    expect(stopDialogModel).not.toContain("const [isSubmitting, setIsSubmitting]");
    expect(stopDialogModel).not.toContain("const [submitError, setSubmitError]");
    expect(stopDialogTypes).toContain("export interface StopDialogProps");
    expect(stopDialogTypes).toContain("StopDialogCopy");
    expect(stopDialogCopy).toContain("export function stopDialogCopy");
    expect(stopDialogCopy).toContain("export interface StopDialogCopy");
  });

  it("keeps stop dialog detail serialization split from utility ids", () => {
    const stopDialogFieldIds = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/stop-dialog-field-ids.ts");
    const stopDialog = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/StopDialog.tsx");
    const stopDialogFormFields = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/StopDialogFormFields.tsx");
    const stopDetails = readItineraryArchitectureSource("src/features/itinerary/domain/stop-details.ts");
    const stopDetailDefinitions = readItineraryArchitectureSource("src/features/itinerary/domain/stop-detail-definitions.ts");

    expect(stopDialogFieldIds).toContain("export const stopDialogFieldIds");
    expect(stopDialogFieldIds).not.toContain("@/src/features/itinerary/domain/stop-details");
    expect(stopDialogFieldIds).not.toContain("buildStructuredStopDetails");
    expect(stopDialog).toContain("@/src/features/itinerary/domain/stop-details");
    expect(stopDialogFormFields).toContain("@/src/features/itinerary/domain/stop-details");
    expect(stopDetails).toContain("./stop-detail-definitions");
    expect(stopDetails).toContain("export function buildStructuredStopDetails");
    expect(stopDetails).toContain("function trimmedStopDetailValues");
    expect(stopDetails).not.toContain("export function stopDetailLabels");
    expect(stopDetails).not.toContain("export const emptyStopDetailValues");
    expect(stopDetailDefinitions).toContain("export function stopDetailLabels");
    expect(stopDetailDefinitions).toContain("export const emptyStopDetailValues");
  });
});
