import type { Member } from "@/src/trip/types";
import { Badge, Panel } from "./ui";
import { Icon } from "./icons";

export function PeoplePanel({ members, currentMemberId }: { members: Member[]; currentMemberId: string }) {
  return (
    <Panel className="context-module people-module" aria-label="People and presence">
      <div className="module-title-row">
        <span className="section-kicker">People</span>
        <Icon name="users" />
      </div>
      <div className="people-list">
        {members.map((member) => (
          <div className="person-row" key={member.id}>
            <span className="person-avatar" style={{ backgroundColor: member.color }} aria-hidden="true">{member.displayName.slice(0, 1)}</span>
            <div>
              <strong>{member.displayName}</strong>
              <span>{member.role}</span>
            </div>
            <Badge tone={member.id === currentMemberId ? "primary" : member.presence === "online" ? "success" : "neutral"}>{member.presence}</Badge>
          </div>
        ))}
      </div>
    </Panel>
  );
}
