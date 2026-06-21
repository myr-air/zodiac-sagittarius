import { describe, expect, it, vi } from "vitest";
import { TripApiError } from "@/src/trip/api-client";
import type { TripCockpit } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import {
  reloadWorkspaceCockpitAfterConflict,
  runWorkspaceVersionConflictRetry,
} from "./workspace-api-conflict-retry";

describe("runWorkspaceVersionConflictRetry", () => {
  it("runs the command with the current context", async () => {
    const events: string[] = [];

    await runWorkspaceVersionConflictRetry({
      getContext: () => "initial",
      reloadOnConflict: async () => {
        events.push("reload");
      },
      run: async (context) => {
        events.push(`run:${context}`);
      },
    });

    expect(events).toEqual(["run:initial"]);
  });

  it("reloads and retries once after a version conflict", async () => {
    let currentContext = "stale";
    const events: string[] = [];

    await runWorkspaceVersionConflictRetry({
      getContext: () => currentContext,
      reloadOnConflict: async (context) => {
        events.push(`reload:${context}`);
        currentContext = "fresh";
      },
      run: async (context) => {
        events.push(`run:${context}`);
        if (context === "stale") {
          throw new TripApiError({
            code: "version_conflict",
            message: "conflict",
            status: 409,
          });
        }
      },
    });

    expect(events).toEqual(["run:stale", "reload:stale", "run:fresh"]);
  });

  it("throws when the retry also conflicts", async () => {
    const reloadOnConflict = vi.fn();

    await expect(
      runWorkspaceVersionConflictRetry({
        getContext: () => "stale",
        reloadOnConflict,
        run: async () => {
          throw new TripApiError({
            code: "version_conflict",
            message: "conflict",
            status: 409,
          });
        },
      }),
    ).rejects.toMatchObject({ code: "version_conflict" });

    expect(reloadOnConflict).toHaveBeenCalledTimes(1);
  });

  it("does not reload for non-conflict errors", async () => {
    const reloadOnConflict = vi.fn();

    await expect(
      runWorkspaceVersionConflictRetry({
        getContext: () => "current",
        reloadOnConflict,
        run: async () => {
          throw new Error("network failed");
        },
      }),
    ).rejects.toThrow("network failed");

    expect(reloadOnConflict).not.toHaveBeenCalled();
  });

  it("reloads the cockpit and updates the latest trip reference", async () => {
    const freshTrip = { ...seedTrip, id: "trip-fresh" };
    const staleTrip = { ...seedTrip, id: "trip-stale" };
    const cockpit: TripCockpit = {
      trip: freshTrip,
      suggestions: [],
      tasks: [],
      stopNotes: [],
      expenseSummary: null,
    };
    const loadTrip = vi.fn(async () => cockpit);
    const replaceCockpitFromApi = vi.fn();
    const latestTripRef = { current: staleTrip };

    await reloadWorkspaceCockpitAfterConflict({
      apiClient: { loadTrip },
      currentTrip: latestTripRef.current,
      latestTripRef,
      participantSession: { sessionToken: "session-token" },
      replaceCockpitFromApi,
    });

    expect(loadTrip).toHaveBeenCalledWith("trip-stale", "session-token");
    expect(replaceCockpitFromApi).toHaveBeenCalledWith(cockpit);
    expect(latestTripRef.current).toBe(freshTrip);
  });
});
