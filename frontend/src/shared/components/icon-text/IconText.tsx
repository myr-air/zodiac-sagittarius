import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";
import { Icon, type IconName } from "@/src/ui/icons";

interface IconTextProps {
  children: ReactNode;
  className?: string;
  icon: IconName;
}

export function IconText({ children, className, icon }: IconTextProps) {
  return (
    <span className={cn(className)}>
      <Icon name={icon} /> {children}
    </span>
  );
}
