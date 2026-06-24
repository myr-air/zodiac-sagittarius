import { describe, expect, it } from "vitest";
import type { Member } from "@/src/trip/types";

import {
  buildMemberTaskDialogSubmission,
  closeMemberTaskDialogState,
  initialMemberTaskDialogFormState,
  openMemberTaskDialogState,
  updateMemberTaskDialogPasswordValue,
} from "../member-task-dialog-state";

const member: Member = {
  color: "#f97316",
  displayName: "Nam",
  id: "member-nam",
  presence: "online",
  role: "traveler",
};

describe("member task dialog state", () => {
  it("opens and closes dialogs with clean password state", () => {
    const state = openMemberTaskDialogState({ kind: "password", member });

    expect(state).toEqual({
      dialog: { kind: "password", member },
      passwordError: null,
      passwordValue: "",
    });
    expect(closeMemberTaskDialogState()).toBe(
      initialMemberTaskDialogFormState,
    );
  });

  it("clears password errors when password input changes", () => {
    expect(
      updateMemberTaskDialogPasswordValue(
        {
          dialog: { kind: "password", member },
          passwordError: "too short",
          passwordValue: "abc",
        },
        "abcd",
      ),
    ).toEqual({
      dialog: { kind: "password", member },
      passwordError: null,
      passwordValue: "abcd",
    });
  });

  it("builds reset, access, and transfer submissions from the active dialog", () => {
    expect(
      buildMemberTaskDialogSubmission(
        openMemberTaskDialogState({ kind: "reset", member }),
        "too short",
      ),
    ).toEqual({ kind: "reset", memberId: "member-nam" });

    expect(
      buildMemberTaskDialogSubmission(
        openMemberTaskDialogState({
          accessStatus: "disabled",
          actionLabel: "Disable",
          kind: "access",
          member,
        }),
        "too short",
      ),
    ).toEqual({
      accessStatus: "disabled",
      kind: "access",
      memberId: "member-nam",
    });

    expect(
      buildMemberTaskDialogSubmission(
        openMemberTaskDialogState({ kind: "transfer", member }),
        "too short",
      ),
    ).toEqual({ kind: "transfer", memberId: "member-nam" });
  });

  it("keeps the dialog open with an error for short passwords", () => {
    const state = updateMemberTaskDialogPasswordValue(
      openMemberTaskDialogState({ kind: "password", member }),
      "abc",
    );

    expect(buildMemberTaskDialogSubmission(state, "too short")).toEqual({
      kind: "invalidPassword",
      state: {
        ...state,
        passwordError: "too short",
      },
    });
  });

  it("trims and submits valid password values", () => {
    const state = updateMemberTaskDialogPasswordValue(
      openMemberTaskDialogState({ kind: "password", member }),
      "  abcd  ",
    );

    expect(buildMemberTaskDialogSubmission(state, "too short")).toEqual({
      kind: "password",
      memberId: "member-nam",
      password: "abcd",
    });
  });

  it("returns no-op submissions when no dialog is active", () => {
    expect(
      buildMemberTaskDialogSubmission(
        initialMemberTaskDialogFormState,
        "too short",
      ),
    ).toEqual({ kind: "none" });
  });
});
