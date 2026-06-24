import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "../../workspace/contracts/workspace-source-boundaries.sources";

describe("Sagittarius account trip join source boundaries", () => {
  it("keeps trip join shell, forms, status, response mapping, and copy split by responsibility", () => {
    const {
      tripJoinGate,
      tripJoinGateChrome,
      tripJoinGateVisual,
      tripJoinRoomForm,
      tripJoinParticipantAuthForm,
      tripJoinParticipantStep,
      tripJoinParticipantStatus,
      tripJoinResponseMapper,
      tripJoinErrorMessage,
      tripJoinGateStyles,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(tripJoinGate).toContain("composition/TripJoinGateChrome");
    expect(tripJoinGate).not.toContain("TripJoinGateVisual");
    expect(tripJoinGate).toContain("TripJoinRoomForm");
    expect(tripJoinGate).toContain("composition/TripJoinParticipantStep");
    expect(tripJoinGate).toContain("export interface TripJoinGateProps");
    expect(tripJoinGate).not.toContain("joinFormClassName");
    expect(tripJoinGate).not.toContain("participantGridClassName");
    expect(tripJoinGate).not.toContain("joinHeroClassName");
    expect(tripJoinGate).not.toContain("tripAccessRightColumnClassName");
    expect(tripJoinGateChrome).toContain("export function TripJoinGateChrome");
    expect(tripJoinGateChrome).toContain("TripJoinGateVisual");
    expect(tripJoinGateChrome).toContain("joinHeroClassName");
    expect(tripJoinGateChrome).toContain("tripAccessRightColumnClassName");
    expect(tripJoinRoomForm).toContain("export function TripJoinRoomForm");
    expect(tripJoinRoomForm).toContain("joinFormClassName");
    expect(tripJoinParticipantStep).toContain("export function TripJoinParticipantStep");
    expect(tripJoinParticipantStep).toContain("TripJoinParticipantAuthForm");
    expect(tripJoinParticipantStep).toContain("../model/trip-join-participant-status");
    expect(tripJoinParticipantStep).toContain("participantGridClassName");
    expect(tripJoinParticipantStep).not.toContain("passwordInputRowClassName");
    expect(tripJoinParticipantAuthForm).toContain(
      "export function TripJoinParticipantAuthForm",
    );
    expect(tripJoinParticipantAuthForm).toContain(
      "export interface TripJoinParticipantAuthFormProps",
    );
    expect(tripJoinParticipantAuthForm).toContain("passwordInputRowClassName");
    expect(tripJoinGate).not.toContain("tripAccessPhotoKrabiClassName");
    expect(tripJoinGateVisual).toContain("export function TripJoinGateVisual");
    expect(tripJoinGateVisual).toContain("tripAccessPhotoKrabiClassName");
    expect(tripJoinGateStyles).toContain("tripAccessRightColumnClassName");
    expect(tripJoinGate).not.toContain("./model/trip-join-response-mapper");
    expect(tripJoinGate).not.toContain("export { tripFromJoinResponse }");
    expect(tripJoinGate).not.toContain("function tripFromJoinResponse");
    expect(tripJoinGate).not.toContain("function friendlyErrorText");
    expect(tripJoinGate).not.toContain("assertMainPlanPointerAliasesMatch");
    expect(tripJoinParticipantStatus).toContain("export function participantStatusLabel");
    expect(tripJoinResponseMapper).toContain("export function tripFromJoinResponse");
    expect(tripJoinResponseMapper).toContain("assertMainPlanPointerAliasesMatch");
    expect(tripJoinErrorMessage).toContain("export function errorMessage");
    expect(tripJoinErrorMessage).toContain("function friendlyErrorText");
  });
});
