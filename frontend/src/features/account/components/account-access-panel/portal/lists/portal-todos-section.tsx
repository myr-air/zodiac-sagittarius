import type { AccountTodoSummary } from "@/src/account/api-client";
import { Badge } from "@/src/ui";
import { appRoutes } from "@/src/routes/app-routes";
import { useI18n } from "@/src/i18n/I18nProvider";
import { PortalList, PortalListRow } from "./account-portal-list";
import { buildAccountPortalTodoListRows } from "./account-portal-todo-list-item.model";
import { PanelHeading } from "../../primitives/account-panel-heading";
import { PortalEmptyState, PortalListSkeleton } from "../primitives/account-portal-primitives";

export function PortalTodosSection({
  className,
  isLoading,
  todos,
}: {
  className: string;
  isLoading: boolean;
  todos: AccountTodoSummary[];
}) {
  const { t } = useI18n();
  const todoRows = buildAccountPortalTodoListRows(todos);

  return (
    <section className={className} id="portal-to-dos">
      <PanelHeading icon="list" title={t.access.portal.sections.todos.title} detail={t.access.portal.sections.todos.detail} />
      {isLoading && !todos.length ? (
        <PortalListSkeleton rows={1} />
      ) : todos.length ? (
        <PortalList>
          {todoRows.map((todo) => (
            <PortalListRow
              key={todo.id}
              icon="list"
              title={todo.title}
              detail={todo.detail}
              badge={<Badge tone={todo.badgeTone}>{todo.badgeLabel}</Badge>}
            />
          ))}
        </PortalList>
      ) : (
        <PortalEmptyState
          actionHref={appRoutes.portalNewTrip()}
          actionLabel={t.access.portal.emptyStates.todos.action}
          detail={t.access.portal.emptyStates.todos.detail}
          icon="list"
          title={t.access.portal.emptyStates.todos.title}
        />
      )}
    </section>
  );
}
