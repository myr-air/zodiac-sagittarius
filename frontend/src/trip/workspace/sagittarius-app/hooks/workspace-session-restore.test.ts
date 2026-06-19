import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { TripParticipantSession } from "@/src/trip/types";
import {
  resolveWorkspaceSessionRestore,
  resolveWorkspaceSessionTrip,
} from "./workspace-session-restore";

const session: TripParticipantSession = {
  createdAt: "2026-06-01T00:00:00.000Z",
  expiresAt: "2026-06-02T00:00:00.000Z",
  memberId: "member-aom",
  sessionToken: "participant-session",
  tripId: seedTrip.id,
};

describe("resolveWorkspaceSessionRestore", () => {
  it("normalizes the trip used by participant-session restore checks", () => {
    const persistedTrip = {
      ...seedTrip,
      mainTripPlanId: undefined,
    };

    expect(
      resolveWorkspaceSessionTrip(seedTrip, persistedTrip).mainTripPlanId,
    ).toBe(seedTrip.activePlanVariantId);
  });

  it("returns trip-state updates when a persisted draft exists", () => {
    const restored = resolveWorkspaceSessionRestore({
      initialTrip: seedTrip,
      persistedSession: session,
      persistedTrip: {
        ...seedTrip,
        name: "Persisted trip",
      },
    });

    expect(restored.shouldReplaceTripState).toBe(true);
    expect(restored.nextTrip.name).toBe("Persisted trip");
    expect(restored.selectedTripPlanId).toBe(seedTrip.activePlanVariantId);
    expect(restored.participantSession).toBe(session);
    expect(restored.currentMemberId).toBe("member-aom");
  });

  it("keeps the initial trip when no persisted draft exists", () => {
    const restored = resolveWorkspaceSessionRestore({
      initialTrip: seedTrip,
      persistedSession: null,
      persistedTrip: null,
    });

    expect(restored.shouldReplaceTripState).toBe(false);
    expect(restored.nextTrip.id).toBe(seedTrip.id);
    expect(restored.selectedTripPlanId).toBeNull();
    expect(restored.participantSession).toBeNull();
    expect(restored.currentMemberId).toBeNull();
  });
});
