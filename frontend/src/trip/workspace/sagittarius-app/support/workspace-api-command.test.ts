import { describe, expect, it, vi } from "vitest";
import { TripApiError } from "@/src/trip/api-error";
import { runWorkspaceApiCommand } from "./workspace-api-command";

describe("runWorkspaceApiCommand", () => {
  it("sets busy while a command succeeds", async () => {
    const events: string[] = [];

    await expect(
      runWorkspaceApiCommand({
        command: async () => {
          events.push("command");
        },
        reloadOnConflict: async () => {
          events.push("reload");
        },
        setBusy: (busy) => events.push(`busy:${busy}`),
        setError: (error) => events.push(`error:${error}`),
        errorMessage: "Could not update plan",
      }),
    ).resolves.toBe(true);

    expect(events).toEqual(["busy:true", "command", "busy:false"]);
  });

  it("reloads and reports success for version conflicts", async () => {
    const reloadOnConflict = vi.fn();
    const setError = vi.fn();
    const setBusy = vi.fn();

    await expect(
      runWorkspaceApiCommand({
        command: async () => {
          throw new TripApiError({
            code: "version_conflict",
            message: "Reload required",
            status: 409,
          });
        },
        reloadOnConflict,
        setBusy,
        setError,
        errorMessage: "Could not update plan",
      }),
    ).resolves.toBe(true);

    expect(reloadOnConflict).toHaveBeenCalledTimes(1);
    expect(setError).not.toHaveBeenCalled();
    expect(setBusy.mock.calls).toEqual([[true], [false]]);
  });

  it("sets the generic error message for non-conflict failures", async () => {
    const reloadOnConflict = vi.fn();
    const setError = vi.fn();
    const setBusy = vi.fn();

    await expect(
      runWorkspaceApiCommand({
        command: async () => {
          throw new TripApiError({
            code: "request_failed",
            message: "Server unavailable",
            status: 503,
          });
        },
        reloadOnConflict,
        setBusy,
        setError,
        errorMessage: "Could not update plan",
      }),
    ).resolves.toBe(false);

    expect(reloadOnConflict).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith("Could not update plan");
    expect(setBusy.mock.calls).toEqual([[true], [false]]);
  });
});
