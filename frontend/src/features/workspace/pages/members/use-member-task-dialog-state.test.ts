import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const membersPageDir = dirname(fileURLToPath(import.meta.url));

function readMembersPageSource(fileName: string) {
  return readFileSync(join(membersPageDir, fileName), "utf8");
}

describe("members page state structure", () => {
  it("keeps member task dialog workflow out of the page state hook", () => {
    const pageStateSource = readMembersPageSource("use-trip-members-page-state.ts");
    const taskDialogSource = readMembersPageSource("use-member-task-dialog-state.ts");

    expect(pageStateSource).toContain("useMemberTaskDialogState");
    expect(pageStateSource).not.toContain("function submitMemberDialog");
    expect(taskDialogSource).toContain("export function useMemberTaskDialogState");
    expect(taskDialogSource).toContain("function submitMemberDialog");
  });
});
