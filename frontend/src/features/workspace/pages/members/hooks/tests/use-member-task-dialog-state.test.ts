import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const membersPageDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readMembersPageSource(fileName: string) {
  return readFileSync(join(membersPageDir, fileName), "utf8");
}

describe("members page state structure", () => {
  it("keeps member task dialog workflow out of the page state hook", () => {
    const pageStateSource = readMembersPageSource(
      "hooks/use-trip-members-page-state.ts",
    );
    const memberPageStateSource = readMembersPageSource(
      "model/member-page-state.ts",
    );
    const memberTaskDialogSource = readMembersPageSource("components/MemberTaskDialog.tsx");
    const memberStylesSource = readMembersPageSource("TripMembersPage.styles.ts");
    const taskDialogSource = readMembersPageSource(
      "hooks/useMemberTaskDialogState.ts",
    );
    const createFormSource = readMembersPageSource(
      "hooks/useMemberCreateFormState.ts",
    );
    const taskDialogStateSource = readMembersPageSource(
      "model/member-task-dialog-state.ts",
    );

    expect(pageStateSource).toContain("useMemberTaskDialogState");
    expect(pageStateSource).toContain("useMemberCreateFormState");
    expect(pageStateSource).toContain("initialMemberFilterState");
    expect(pageStateSource).toContain("updateMemberFilterState");
    expect(pageStateSource).toContain("const [filterState, setFilterState]");
    expect(pageStateSource).not.toContain("const [createFormState, setCreateFormState]");
    expect(pageStateSource).not.toContain("const [query, setQuery]");
    expect(pageStateSource).not.toContain("const [newMemberName, setNewMemberName]");
    expect(pageStateSource).not.toContain("function submitMemberDialog");
    expect(pageStateSource).not.toContain("function submitNewMember");
    expect(memberPageStateSource).toContain("export interface MemberFilterState");
    expect(memberPageStateSource).toContain("export interface MemberCreateFormState");
    expect(memberPageStateSource).toContain(
      "export const initialMemberFilterState",
    );
    expect(memberPageStateSource).toContain(
      "export function updateMemberFilterState",
    );
    expect(createFormSource).toContain("export function useMemberCreateFormState");
    expect(createFormSource).toContain("initialMemberCreateFormState");
    expect(createFormSource).toContain("updateMemberCreateFormState");
    expect(createFormSource).toContain("setMemberCreatePanelOpenState");
    expect(createFormSource).toContain("buildCreateMemberInput");
    expect(pageStateSource).toContain("./useMemberInviteActions");
    expect(pageStateSource).toContain("./useMemberCreateFormState");
    expect(pageStateSource).toContain("./useMemberTaskDialogState");
    expect(taskDialogSource).toContain("export function useMemberTaskDialogState");
    expect(taskDialogSource).toContain("const [dialogState, setDialogState]");
    expect(taskDialogSource).toContain("../model/member-task-dialog-state");
    expect(taskDialogSource).toContain("function submitMemberDialog");
    expect(taskDialogSource).not.toContain("const [memberDialog, setMemberDialog]");
    expect(taskDialogSource).not.toContain("const [passwordValue, setPasswordValue]");
    expect(taskDialogSource).not.toContain("const [passwordError, setPasswordError]");
    expect(memberTaskDialogSource).toContain("WorkspaceCompactFormDialog");
    expect(memberTaskDialogSource).not.toContain("memberDialogBackdropClassName");
    expect(memberTaskDialogSource).not.toContain("memberDialogActionsClassName");
    expect(memberStylesSource).not.toContain("workspacePaddedDialogBackdropClassName");
    expect(memberStylesSource).not.toContain("workspaceCompactDialogActionsClassName");
    expect(taskDialogStateSource).toContain("export interface MemberTaskDialogFormState");
    expect(taskDialogStateSource).toContain("export function buildMemberTaskDialogSubmission");
  });
});
