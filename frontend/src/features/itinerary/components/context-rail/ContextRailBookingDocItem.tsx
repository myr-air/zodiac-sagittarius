import type { ChangeEvent, KeyboardEvent } from "react";
import { Select } from "@/src/ui";
import { formatBookingDocTypeLabel } from "@/src/features/itinerary/domain/itinerary-booking-display";
import type { BookingDoc, BookingDocType } from "@/src/trip/types";
import {
  bookingDocClassName,
  bookingDocQuickFieldClassName,
  bookingDocTypeSelectClassName,
} from "./context-rail.styles";
import { bookingDocTypeOptions } from "./context-rail.utils";
import {
  bookingDocQuickFieldKeys,
  buildBookingDocQuickFieldPatch,
  getBookingDocQuickFieldValue,
  type BookingDocQuickFieldKey,
} from "./booking-doc-quick-fields";
import type {
  ContextRailBookingDocQuickFieldsChangeHandler,
  ContextRailBookingDocTypeChangeHandler,
} from "./context-rail.types";

interface ContextRailBookingDocItemProps {
  bookingDoc: BookingDoc;
  canEdit: boolean;
  copy: {
    booking: string;
    type: string;
    typeFor: (input: { title: string }) => string;
    provider: string;
    providerFor: (input: { title: string }) => string;
    providerPlaceholder: string;
    reference: string;
    referenceFor: (input: { title: string }) => string;
    referencePlaceholder: string;
  };
  onChangeBookingDocType?: ContextRailBookingDocTypeChangeHandler;
  onChangeBookingDocQuickFields?: ContextRailBookingDocQuickFieldsChangeHandler;
}

function getDraftValue(target: HTMLInputElement): string {
  return (target.dataset.draftValue ?? target.value).trim();
}

function handleQuickFieldCommit(
  event: ChangeEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>,
  bookingDoc: BookingDoc,
  key: BookingDocQuickFieldKey,
  onChangeBookingDocQuickFields?: ContextRailBookingDocItemProps["onChangeBookingDocQuickFields"],
) {
  if ("key" in event && event.key !== "Enter") return;
  event.preventDefault();

  const patch = buildBookingDocQuickFieldPatch(
    bookingDoc,
    key,
    getDraftValue(event.currentTarget),
  );
  if (!patch) return;
  onChangeBookingDocQuickFields?.(bookingDoc.id, patch);
}

function bookingDocQuickFieldCopy(
  copy: ContextRailBookingDocItemProps["copy"],
  key: BookingDocQuickFieldKey,
) {
  if (key === "providerName") {
    return {
      label: copy.provider,
      placeholder: copy.providerPlaceholder,
      ariaLabel: copy.providerFor,
    };
  }

  return {
    label: copy.reference,
    placeholder: copy.referencePlaceholder,
    ariaLabel: copy.referenceFor,
  };
}

export function ContextRailBookingDocItem({
  bookingDoc,
  canEdit,
  copy,
  onChangeBookingDocType,
  onChangeBookingDocQuickFields,
}: ContextRailBookingDocItemProps) {
  return (
    <li className={bookingDocClassName}>
      <strong>{bookingDoc.title}</strong>
      <span>
        {copy.booking} · {bookingDoc.status}
      </span>
      <label className="grid gap-1">
        <span>{copy.type}</span>
        <Select
          aria-label={copy.typeFor({ title: bookingDoc.title })}
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
      {bookingDocQuickFieldKeys.map((key) => {
        const fieldCopy = bookingDocQuickFieldCopy(copy, key);
        return (
          <label className="grid gap-1" key={key}>
            <span>{fieldCopy.label}</span>
            <input
              aria-label={fieldCopy.ariaLabel({ title: bookingDoc.title })}
              className={bookingDocQuickFieldClassName}
              defaultValue={getBookingDocQuickFieldValue(bookingDoc, key)}
              disabled={!canEdit || !onChangeBookingDocQuickFields}
              placeholder={fieldCopy.placeholder}
              onChange={(event) => {
                event.currentTarget.dataset.draftValue = event.target.value;
              }}
              onBlur={(event) =>
                handleQuickFieldCommit(
                  event,
                  bookingDoc,
                  key,
                  onChangeBookingDocQuickFields,
                )
              }
              onKeyDown={(event) =>
                handleQuickFieldCommit(
                  event,
                  bookingDoc,
                  key,
                  onChangeBookingDocQuickFields,
                )
              }
            />
          </label>
        );
      })}
    </li>
  );
}
