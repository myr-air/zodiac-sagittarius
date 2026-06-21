import { isVersionConflict } from "@/src/trip/api-errors";

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
