import type { ChangeEvent, KeyboardEvent } from "react";
import { SelectOptions } from "@/src/shared/components/select-options";
import { Select } from "@/src/ui";
import type { BookingDoc, BookingDocType } from "@/src/trip/types";
import {
  bookingDocClassName,
  bookingDocQuickFieldClassName,
  bookingDocTypeSelectClassName,
} from "./context-rail.styles";
import {
  bookingDocQuickFieldKeys,
  getBookingDocQuickFieldValue,
  type BookingDocQuickFieldKey,
} from "@/src/trip/booking-docs";
import {
  bookingDocQuickFieldCopy,
  bookingDocQuickFieldPatchFromDraft,
  shouldCommitBookingDocQuickField,
} from "./context-rail-booking-doc-item-model";
import { contextRailBookingDocTypeSelectOptions } from "./context-rail-select-options";
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

function handleQuickFieldCommit(
  event: ChangeEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>,
  bookingDoc: BookingDoc,
  key: BookingDocQuickFieldKey,
  onChangeBookingDocQuickFields?: ContextRailBookingDocItemProps["onChangeBookingDocQuickFields"],
) {
  if (!shouldCommitBookingDocQuickField("key" in event ? event.key : undefined)) {
    return;
  }
  event.preventDefault();

  const patch = bookingDocQuickFieldPatchFromDraft({
    bookingDoc,
    key,
    target: event.currentTarget,
  });
  if (!patch) return;
  onChangeBookingDocQuickFields?.(bookingDoc.id, patch);
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
          <SelectOptions options={contextRailBookingDocTypeSelectOptions()} />
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
