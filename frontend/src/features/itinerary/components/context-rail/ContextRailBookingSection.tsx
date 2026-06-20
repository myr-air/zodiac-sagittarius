import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import type {
  BookingDoc,
  ItineraryItem,
  TripTask,
} from "@/src/trip/types";
import {
  bookingAdvisoryClassName,
  bookingTaskClassName,
  bookingTaskLabelClassName,
  bookingTaskMetaClassName,
  detailHeadingClassName,
  detailSectionClassName,
  emptyWarningClassName,
  moduleListClassName,
} from "./context-rail.styles";
import { ContextRailBookingDocItem } from "./ContextRailBookingDocItem";
import { taskKindLabel } from "./context-rail.utils";
import type {
  ContextRailBookingDocQuickFieldsChangeHandler,
  ContextRailBookingDocTypeChangeHandler,
} from "./context-rail.types";

interface ContextRailBookingSectionProps {
  advisories: NonNullable<ItineraryItem["advisories"]>;
  bookingDocs: BookingDoc[];
  tasks: TripTask[];
  canEdit: boolean;
  onChangeBookingDocType?: ContextRailBookingDocTypeChangeHandler;
  onChangeBookingDocQuickFields?: ContextRailBookingDocQuickFieldsChangeHandler;
  onToggleTaskStatus: (taskId: string) => void;
}

export function ContextRailBookingSection({
  advisories,
  bookingDocs,
  tasks,
  canEdit,
  onChangeBookingDocType,
  onChangeBookingDocQuickFields,
  onToggleTaskStatus,
}: ContextRailBookingSectionProps) {
  const { t } = useI18n();

  return (
    <section
      className={`${detailSectionClassName} stop-booking-module`}
      aria-label={t.contextRail.booking.label}
    >
      <h3 className={detailHeadingClassName}>{t.contextRail.booking.title}</h3>
      <div className={`booking-advisory-list ${moduleListClassName}`}>
        {advisories.map((advisory) => (
          <span
            className={`${bookingAdvisoryClassName} booking-advisory--${advisory.severity}`}
            key={advisory.code}
          >
            <Icon name="alertCircle" /> {advisory.label}
          </span>
        ))}
        {!advisories.length ? (
          <span className={emptyWarningClassName}>
            {t.contextRail.booking.noWarnings}
          </span>
        ) : null}
      </div>
      <ul className={`stop-booking-doc-list ${moduleListClassName}`}>
        {bookingDocs.map((bookingDoc) => (
          <ContextRailBookingDocItem
            bookingDoc={bookingDoc}
            canEdit={canEdit}
            copy={t.contextRail.booking}
            key={bookingDoc.id}
            onChangeBookingDocType={onChangeBookingDocType}
            onChangeBookingDocQuickFields={onChangeBookingDocQuickFields}
          />
        ))}
        {!bookingDocs.length ? (
          <li className={emptyWarningClassName}>
            {t.contextRail.booking.noBookings}
          </li>
        ) : null}
      </ul>
      <ul className={`stop-booking-task-list ${moduleListClassName}`}>
        {tasks.map((task) => (
          <li className={bookingTaskClassName} data-status={task.status} key={task.id}>
            <label className={bookingTaskLabelClassName}>
              <input
                type="checkbox"
                checked={task.status === "done"}
                disabled={!canEdit}
                onChange={() => onToggleTaskStatus(task.id)}
              />
              <span>{task.title}</span>
            </label>
            <small className={bookingTaskMetaClassName}>
              {taskKindLabel(task, t.contextRail.booking)}
            </small>
          </li>
        ))}
        {!tasks.length ? (
          <li className={emptyWarningClassName}>
            {t.contextRail.booking.noTasks}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
