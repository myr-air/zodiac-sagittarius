import { isVersionConflict } from "@/src/trip/api-errors";

export interface RunTripPlanApiCommandInput {
  command: () => Promise<void>;
  reloadOnConflict: () => Promise<void>;
  setBusy: (busy: boolean) => void;
  setError: (error: string | null) => void;
  errorMessage: string;
}

export async function runTripPlanApiCommand({
  command,
  reloadOnConflict,
  setBusy,
  setError,
  errorMessage,
}: RunTripPlanApiCommandInput): Promise<boolean> {
  setBusy(true);
  try {
    await command();
  } catch (error) {
    if (isVersionConflict(error)) {
      await reloadOnConflict();
      return true;
    }
    setError(errorMessage);
    return false;
  } finally {
    setBusy(false);
  }
  return true;
}
