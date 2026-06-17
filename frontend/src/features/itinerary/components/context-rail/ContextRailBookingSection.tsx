import { ChangeEvent, KeyboardEvent } from "react";
import { Icon } from "@/src/ui/icons";
import { Select } from "@/src/ui";
import { useI18n } from "@/src/i18n/I18nProvider";
import type {
  BookingDoc,
  BookingDocType,
  ItineraryItem,
  TripTask,
} from "@/src/trip/types";
import {
  bookingAdvisoryClassName,
  bookingDocClassName,
  bookingDocQuickFieldClassName,
  bookingDocTypeSelectClassName,
  bookingTaskClassName,
  bookingTaskLabelClassName,
  bookingTaskMetaClassName,
  detailHeadingClassName,
  detailSectionClassName,
  emptyWarningClassName,
  moduleListClassName,
} from "./context-rail.styles";
import { bookingDocTypeOptions, taskKindLabel } from "./context-rail.utils";
import { formatBookingDocTypeLabel } from "./context-rail.utils";

interface ContextRailBookingSectionProps {
  advisories: NonNullable<ItineraryItem["advisories"]>;
  bookingDocs: BookingDoc[];
  tasks: TripTask[];
  canEdit: boolean;
  onChangeBookingDocType?: (
    bookingDocId: string,
    type: BookingDocType,
  ) => void | Promise<void>;
  onChangeBookingDocQuickFields?: (
    bookingDocId: string,
    patch: {
      confirmationCode?: string | null;
      providerName?: string | null;
    },
  ) => void | Promise<void>;
  onToggleTaskStatus: (taskId: string) => void;
}

function getDraftValue(target: HTMLInputElement): string {
  return (target.dataset.draftValue ?? target.value).trim();
}

function handleQuickFieldCommit(
  event: ChangeEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>,
  bookingDoc: BookingDoc,
  key: "providerName" | "confirmationCode",
  onChangeBookingDocQuickFields?: ContextRailBookingSectionProps["onChangeBookingDocQuickFields"],
) {
  if ("key" in event && event.key !== "Enter") return;
  event.preventDefault();

  const target = event.currentTarget;
  const value = getDraftValue(target);
  const existingValue =
    key === "providerName" ? bookingDoc.providerName ?? "" : bookingDoc.confirmationCode ?? "";
  if (value === existingValue) return;

  onChangeBookingDocQuickFields?.(bookingDoc.id, {
    [key]: value || null,
  });
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
          <li className={bookingDocClassName} key={bookingDoc.id}>
            <strong>{bookingDoc.title}</strong>
            <span>
              {t.contextRail.booking.booking} · {bookingDoc.status}
            </span>
            <label className="grid gap-1">
              <span>{t.contextRail.booking.type}</span>
              <Select
                aria-label={t.contextRail.booking.typeFor({
                  title: bookingDoc.title,
                })}
                className={bookingDocTypeSelectClassName}
                disabled={!canEdit || !onChangeBookingDocType}
                value={bookingDoc.type}
                onChange={(event) =>
                  void onChangeBookingDocType?.(
                    bookingDoc.id,
                    event.target.value as BookingDocType,
                  )
                }
              >
                {bookingDocTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {formatBookingDocTypeLabel(type)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-1">
              <span>{t.contextRail.booking.provider}</span>
              <input
                aria-label={t.contextRail.booking.providerFor({
                  title: bookingDoc.title,
                })}
                className={bookingDocQuickFieldClassName}
                defaultValue={bookingDoc.providerName ?? ""}
                disabled={!canEdit || !onChangeBookingDocQuickFields}
                placeholder={t.contextRail.booking.providerPlaceholder}
                onChange={(event) => {
                  event.currentTarget.dataset.draftValue = event.target.value;
                }}
                onBlur={(event) =>
                  handleQuickFieldCommit(
                    event,
                    bookingDoc,
                    "providerName",
                    onChangeBookingDocQuickFields,
                  )
                }
                onKeyDown={(event) =>
                  handleQuickFieldCommit(
                    event,
                    bookingDoc,
                    "providerName",
                    onChangeBookingDocQuickFields,
                  )
                }
              />
            </label>
            <label className="grid gap-1">
              <span>{t.contextRail.booking.reference}</span>
              <input
                aria-label={t.contextRail.booking.referenceFor({
                  title: bookingDoc.title,
                })}
                className={bookingDocQuickFieldClassName}
                defaultValue={bookingDoc.confirmationCode ?? ""}
                disabled={!canEdit || !onChangeBookingDocQuickFields}
                placeholder={t.contextRail.booking.referencePlaceholder}
                onChange={(event) => {
                  event.currentTarget.dataset.draftValue = event.target.value;
                }}
                onBlur={(event) =>
                  handleQuickFieldCommit(
                    event,
                    bookingDoc,
                    "confirmationCode",
                    onChangeBookingDocQuickFields,
                  )
                }
                onKeyDown={(event) =>
                  handleQuickFieldCommit(
                    event,
                    bookingDoc,
                    "confirmationCode",
                    onChangeBookingDocQuickFields,
                  )
                }
              />
            </label>
          </li>
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
