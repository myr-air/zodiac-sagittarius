import { isVersionConflict } from "@/src/trip/api-client";
import type {
  TripApiClient,
  TripCockpit,
} from "@/src/trip/api-client";
import type {
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";

interface RunWorkspaceVersionConflictRetryOptions<TContext> {
  getContext: () => TContext;
  reloadOnConflict: (context: TContext) => Promise<void>;
  run: (context: TContext) => Promise<void>;
}

export async function runWorkspaceVersionConflictRetry<TContext>({
  getContext,
  reloadOnConflict,
  run,
}: RunWorkspaceVersionConflictRetryOptions<TContext>): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const context = getContext();
    try {
      await run(context);
      return;
    } catch (error) {
      if (!isVersionConflict(error) || attempt > 0) {
        throw error;
      }
      await reloadOnConflict(context);
    }
  }
}

interface ReloadWorkspaceCockpitAfterConflictOptions {
  apiClient: Pick<TripApiClient, "loadTrip">;
  currentTrip: Pick<Trip, "id">;
  latestTripRef: { current: Trip };
  participantSession: Pick<TripParticipantSession, "sessionToken">;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
}

export async function reloadWorkspaceCockpitAfterConflict({
  apiClient,
  currentTrip,
  latestTripRef,
  participantSession,
  replaceCockpitFromApi,
}: ReloadWorkspaceCockpitAfterConflictOptions): Promise<void> {
  const cockpit = await apiClient.loadTrip(
    currentTrip.id,
    participantSession.sessionToken,
  );
  replaceCockpitFromApi(cockpit);
  latestTripRef.current = cockpit.trip;
}
