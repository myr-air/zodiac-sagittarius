import { isVersionConflict } from "@/src/trip/api-client";

export interface RunWorkspaceApiCommandInput {
  command: () => Promise<void>;
  reloadOnConflict: () => Promise<void>;
  setBusy: (busy: boolean) => void;
  setError: (error: string | null) => void;
  errorMessage: string;
}

export async function runWorkspaceApiCommand({
  command,
  reloadOnConflict,
  setBusy,
  setError,
  errorMessage,
}: RunWorkspaceApiCommandInput): Promise<boolean> {
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
