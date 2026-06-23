import type { AccountTodoSummary } from "@/src/account/api-client";
import { Badge } from "@/src/ui";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { useI18n } from "@/src/i18n/I18nProvider";
import { PortalList, PortalListRow } from "./account-portal-list";
import {
  accountPortalTodoBadgeTone,
  accountPortalTodoDetail,
} from "./account-portal-todo-list-item.model";
import { PanelHeading } from "../../primitives/account-panel-heading";
import { PortalEmptyState, PortalListSkeleton } from "../account-portal-primitives";

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

  return (
    <section className={className} id="portal-to-dos">
      <PanelHeading icon="list" title={t.access.portal.sections.todos.title} detail={t.access.portal.sections.todos.detail} />
      {isLoading && !todos.length ? (
        <PortalListSkeleton rows={1} />
      ) : todos.length ? (
        <PortalList>
          {todos.map((todo) => (
            <PortalListRow
              key={todo.id}
              icon="list"
              title={todo.title}
              detail={accountPortalTodoDetail(todo)}
              badge={<Badge tone={accountPortalTodoBadgeTone(todo)}>{todo.status}</Badge>}
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
