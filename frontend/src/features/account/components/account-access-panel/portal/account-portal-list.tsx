import type { ReactNode } from "react";
import { Icon, type IconName } from "@/src/ui/icons";
import {
  portalListClassName,
  portalListIconClassName,
  portalListRowClassName,
} from "./account-portal-list.styles";

export function PortalList({ children }: { children: ReactNode }) {
  return <div className={portalListClassName}>{children}</div>;
}

export function PortalListRow({
  action,
  badge,
  detail,
  icon,
  title,
}: {
  action?: ReactNode;
  badge?: ReactNode;
  detail: ReactNode;
  icon: IconName;
  title: ReactNode;
}) {
  return (
    <article className={portalListRowClassName}>
      <span className={portalListIconClassName} aria-hidden="true"><Icon name={icon} /></span>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      {badge}
      {action}
    </article>
  );
}
