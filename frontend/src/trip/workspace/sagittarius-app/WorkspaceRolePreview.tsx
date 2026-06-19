import { Select } from "@/src/ui";
import type { Trip } from "@/src/trip/types";

interface WorkspaceRolePreviewProps {
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
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.displayName} ({member.role})
          </option>
        ))}
      </Select>
    </label>
  );
}
