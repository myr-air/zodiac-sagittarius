import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const tripJoinGateDir = dirname(fileURLToPath(import.meta.url));

function readTripJoinGateSource(fileName: string) {
  return readFileSync(join(tripJoinGateDir, fileName), "utf8");
}

describe("trip join gate state structure", () => {
  it("keeps invite-token resolution out of the main join gate state hook", () => {
    const stateSource = readTripJoinGateSource("use-trip-join-gate-state.ts");
    const inviteTokenSource = readTripJoinGateSource("use-trip-join-invite-token-resolution.ts");

    expect(stateSource).toContain("useTripJoinInviteTokenResolution");
    expect(stateSource).not.toContain("resolveJoinInviteToken(initialJoinToken)");
    expect(inviteTokenSource).toContain("export function useTripJoinInviteTokenResolution");
    expect(inviteTokenSource).toContain("resolveJoinInviteToken(initialJoinToken)");
  });

  it("keeps join form field state out of the main join gate state hook", () => {
    const stateSource = readTripJoinGateSource("use-trip-join-gate-state.ts");
    const formStateSource = readTripJoinGateSource("use-trip-join-gate-form-state.ts");

    expect(stateSource).toContain("useTripJoinGateFormState");
    expect(stateSource).not.toMatch(/const \[joinId,\s*setJoinId\]/);
    expect(stateSource).not.toMatch(/const \[tripPassword,\s*setTripPassword\]/);
    expect(stateSource).not.toMatch(/const \[participantPassword,\s*setParticipantPassword\]/);
    expect(stateSource).not.toMatch(/const \[showTripPassword,\s*setShowTripPassword\]/);
    expect(stateSource).not.toMatch(/const \[showParticipantPassword,\s*setShowParticipantPassword\]/);
    expect(formStateSource).toContain("export function useTripJoinGateFormState");
    expect(formStateSource).toContain("function resetParticipantPassword");
  });

  it("keeps join submit commands out of the main join gate state hook", () => {
    const stateSource = readTripJoinGateSource("use-trip-join-gate-state.ts");
    const submitActionsSource = readTripJoinGateSource("use-trip-join-gate-submit-actions.ts");

    expect(stateSource).toContain("useTripJoinGateSubmitActions");
    expect(stateSource).not.toContain("verifyTripCredentials");
    expect(stateSource).not.toContain("claimTripParticipant");
    expect(stateSource).not.toContain("apiClient.joinTrip");
    expect(stateSource).not.toContain("apiClient.loadTrip");
    expect(submitActionsSource).toContain("export function useTripJoinGateSubmitActions");
    expect(submitActionsSource).toContain("verifyTripCredentials");
    expect(submitActionsSource).toContain("claimTripParticipant");
    expect(submitActionsSource).toContain("apiClient.joinTrip");
    expect(submitActionsSource).toContain("apiClient.loadTrip");
  });
});
