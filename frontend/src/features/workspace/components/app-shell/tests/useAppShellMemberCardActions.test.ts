import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAppShellMemberCardActions } from "../useAppShellMemberCardActions";

describe("useAppShellMemberCardActions", () => {
  it("opens and closes the identity switch dialog when a leave handler exists", () => {
    const { result } = renderHook(() =>
      useAppShellMemberCardActions({
        onLeaveParticipantSession: vi.fn(),
      }),
    );

    act(() => {
      result.current.openLeaveParticipantSessionDialog();
    });
    expect(result.current.identityDialogOpen).toBe(true);

    act(() => {
      result.current.closeLeaveParticipantSessionDialog();
    });
    expect(result.current.identityDialogOpen).toBe(false);
  });

  it("ignores open requests without a leave handler", () => {
    const { result } = renderHook(() =>
      useAppShellMemberCardActions({
        onLeaveParticipantSession: undefined,
      }),
    );

    act(() => {
      result.current.openLeaveParticipantSessionDialog();
    });

    expect(result.current.identityDialogOpen).toBe(false);
  });

  it("confirms the leave handler and closes the dialog", () => {
    const onLeaveParticipantSession = vi.fn();
    const { result } = renderHook(() =>
      useAppShellMemberCardActions({
        onLeaveParticipantSession,
      }),
    );

    act(() => {
      result.current.openLeaveParticipantSessionDialog();
      result.current.confirmLeaveParticipantSession();
    });

    expect(result.current.identityDialogOpen).toBe(false);
    expect(onLeaveParticipantSession).toHaveBeenCalledTimes(1);
  });
});
