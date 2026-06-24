import { useState } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Member } from "@/src/trip/types";
import { initialMemberTaskDialogFormState } from "../../model/member-task-dialog-state";
import { useMemberTaskDialogOpenActions } from "../useMemberTaskDialogOpenActions";

const member: Member = {
  accessStatus: "active",
  color: "#2563eb",
  displayName: "Aom",
  id: "member-aom",
  presence: "online",
  role: "traveler",
};

function createHook(visibleMembers: Member[] = [member]) {
  return renderHook(() => {
    const [dialogState, setDialogState] = useState(
      initialMemberTaskDialogFormState,
    );
    const actions = useMemberTaskDialogOpenActions({
      labels: {
        disable: "Disable access",
        enable: "Enable access",
      },
      setDialogState,
      visibleMembers,
    });

    return {
      ...actions,
      dialogState,
    };
  });
}

describe("useMemberTaskDialogOpenActions", () => {
  it("opens reset, transfer, and password dialogs for visible members", () => {
    const { result } = createHook();

    act(() => {
      result.current.confirmResetClaim("member-aom");
    });
    expect(result.current.dialogState.dialog).toMatchObject({
      kind: "reset",
      member,
    });

    act(() => {
      result.current.confirmTransferOwnership("member-aom");
    });
    expect(result.current.dialogState.dialog).toMatchObject({
      kind: "transfer",
      member,
    });

    act(() => {
      result.current.promptChangePassword("member-aom");
    });
    expect(result.current.dialogState.dialog).toMatchObject({
      kind: "password",
      member,
    });
  });

  it("opens access dialogs with the matching action label", () => {
    const { result } = createHook();

    act(() => {
      result.current.confirmChangeAccessStatus("member-aom", "disabled");
    });
    expect(result.current.dialogState.dialog).toMatchObject({
      accessStatus: "disabled",
      actionLabel: "Disable access",
      kind: "access",
      member,
    });

    act(() => {
      result.current.confirmChangeAccessStatus("member-aom", "active");
    });
    expect(result.current.dialogState.dialog).toMatchObject({
      accessStatus: "active",
      actionLabel: "Enable access",
      kind: "access",
      member,
    });
  });

  it("ignores members outside the visible set", () => {
    const { result } = createHook([]);

    act(() => {
      result.current.confirmResetClaim("member-aom");
      result.current.confirmChangeAccessStatus("member-aom", "disabled");
      result.current.confirmTransferOwnership("member-aom");
      result.current.promptChangePassword("member-aom");
    });

    expect(result.current.dialogState).toBe(initialMemberTaskDialogFormState);
  });
});
