import { cn } from "@/src/lib/cn";
import { memberInitial } from "@/src/trip/members";

interface PersonAvatarProps {
  className?: string;
  color: string;
  name: string;
  title?: string;
}

export function PersonAvatar({ className, color, name, title }: PersonAvatarProps) {
  return (
    <span
      className={cn("person-avatar", className)}
      style={{ backgroundColor: color }}
      aria-hidden="true"
      title={title}
    >
      {memberInitial(name)}
    </span>
  );
}
