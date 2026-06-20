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
});
