import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace import hook source boundaries", () => {
  it("keeps itinerary import model, request builders, mapping, and merge logic split by responsibility", () => {
    const {
      sagaCore,
      workspaceRecordsHook,
      itineraryImportModel,
      itineraryImportApiRequests,
      itineraryImportItemApiRequests,
      itineraryImportRecordApiRequests,
      itineraryImportRecordMapping,
      itineraryImportRecordMerge,
      importHook,
      importApplyCommand,
      importApplyCommandInputs,
      apiImportApplyCommand,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(sagaCore).not.toContain("function buildImportedPlanRecordsForTripPlan");
    expect(sagaCore).not.toContain("function mergeApiImportedPlanRecordsIntoTrip");
    expect(sagaCore).not.toContain("function mergeImportedRecordsIntoTripPlan");
    expect(sagaCore).not.toContain("function buildImportedItineraryItemCreateRequest");
    expect(sagaCore).not.toContain("upsertById");
    expect(sagaCore).not.toContain("async function createImportedPlanRecordsViaApi");
    expect(itineraryImportModel).toContain("./itinerary-import-record-mapping");
    expect(itineraryImportModel).toContain("./itinerary-import-record-merge");
    expect(itineraryImportModel).not.toContain("function buildImportedPlanRecordsForTripPlan");
    expect(itineraryImportModel).not.toContain("function mergeImportedRecordsIntoTripPlan");
    expect(itineraryImportModel).not.toContain("function upsertById");
    expect(itineraryImportApiRequests).toContain("./itinerary-import-item-api-requests");
    expect(itineraryImportApiRequests).toContain("./itinerary-import-record-api-requests");
    expect(itineraryImportApiRequests).not.toContain("function buildImportedItineraryItemCreateRequest");
    expect(itineraryImportApiRequests).not.toContain("function buildImportedTaskCreateRequest");
    expect(itineraryImportItemApiRequests).toContain("export function buildImportedItineraryItemCreateRequest");
    expect(itineraryImportRecordApiRequests).toContain("export function buildImportedTaskCreateRequest");
    expect(itineraryImportRecordApiRequests).toContain("export function buildImportedBookingDocCreateRequest");
    expect(itineraryImportRecordMapping).toContain("export function buildImportedPlanRecordsForTripPlan");
    expect(itineraryImportRecordMerge).toContain("export function mergeImportedRecordsIntoTripPlan");
    expect(itineraryImportRecordMerge).toContain("export function mergeApiImportedPlanRecordsIntoTrip");
    expect(itineraryImportRecordMerge).toContain("export function upsertById");
    expect(importApplyCommand).toContain("./command-inputs/workspace-itinerary-import-apply-inputs");
    expect(importApplyCommand).not.toContain("@/src/trip/workspace/itinerary-import-record-mapping");
    expect(importApplyCommand).toContain("@/src/trip/workspace/itinerary-import-record-merge");
    expect(importApplyCommandInputs).toContain("@/src/trip/workspace/itinerary-import-record-mapping");
    expect(importApplyCommandInputs).toContain("export function buildWorkspaceItineraryImportPreview");
    expect(importApplyCommandInputs).toContain("export function buildWorkspaceLocalItineraryImportApplyInput");
    expect(apiImportApplyCommand).toContain("@/src/trip/workspace/itinerary-import-item-api-requests");
    expect(apiImportApplyCommand).toContain("@/src/trip/workspace/itinerary-import-record-mapping");
    expect(apiImportApplyCommand).toContain("@/src/trip/workspace/itinerary-import-record-merge");
    expect(importHook).toContain("@/src/trip/workspace/itinerary-import-model");
    expect(importHook).toContain("@/src/trip/workspace/itinerary-import-api");
    expect(workspaceRecordsHook).toContain("@/src/trip/workspace/trip-plan-records");
  });
});
