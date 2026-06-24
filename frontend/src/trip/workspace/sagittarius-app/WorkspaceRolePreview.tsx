import { SelectOptions } from "@/src/shared/components/select-options";
import { Select } from "@/src/ui";
import type { Trip } from "@/src/trip/types";
import { buildWorkspaceRolePreviewOptions } from "./workspace-role-preview-options";

export interface WorkspaceRolePreviewProps {
  currentMemberId: string;
  members: Trip["members"];
  onChangeMember: (memberId: string) => void;
}

export function WorkspaceRolePreview({
  currentMemberId,
  members,
  onChangeMember,
}: WorkspaceRolePreviewProps) {
  return (
    <label className="sr-only">
      Role preview
      <Select
        value={currentMemberId}
        onChange={(event) => onChangeMember(event.target.value)}
      >
        <SelectOptions options={buildWorkspaceRolePreviewOptions(members)} />
      </Select>
    </label>
  );
}
