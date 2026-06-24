import type { Trip } from "@/src/trip/types";

export interface WorkspaceRolePreviewOption {
  value: string;
  label: string;
}

export function buildWorkspaceRolePreviewOptions(
  members: Trip["members"],
): WorkspaceRolePreviewOption[] {
  return members.map((member) => ({
    value: member.id,
    label: `${member.displayName} (${member.role})`,
  }));
}
