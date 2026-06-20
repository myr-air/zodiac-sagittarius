import type { ChangeEvent, KeyboardEvent } from "react";
import { Select } from "@/src/ui";
import type { BookingDoc, BookingDocType } from "@/src/trip/types";
import {
  bookingDocClassName,
  bookingDocQuickFieldClassName,
  bookingDocTypeSelectClassName,
} from "./context-rail.styles";
import {
  bookingDocTypeOptions,
  formatBookingDocTypeLabel,
} from "./context-rail.utils";

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
}

function getDraftValue(target: HTMLInputElement): string {
  return (target.dataset.draftValue ?? target.value).trim();
}

function handleQuickFieldCommit(
  event: ChangeEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>,
  bookingDoc: BookingDoc,
  key: "providerName" | "confirmationCode",
  onChangeBookingDocQuickFields?: ContextRailBookingDocItemProps["onChangeBookingDocQuickFields"],
) {
  if ("key" in event && event.key !== "Enter") return;
  event.preventDefault();

  const target = event.currentTarget;
  const value = getDraftValue(target);
  const existingValue =
    key === "providerName"
      ? bookingDoc.providerName ?? ""
      : bookingDoc.confirmationCode ?? "";
  if (value === existingValue) return;

  onChangeBookingDocQuickFields?.(bookingDoc.id, {
    [key]: value || null,
  });
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
      <label className="grid gap-1">
        <span>{copy.provider}</span>
        <input
          aria-label={copy.providerFor({ title: bookingDoc.title })}
          className={bookingDocQuickFieldClassName}
          defaultValue={bookingDoc.providerName ?? ""}
          disabled={!canEdit || !onChangeBookingDocQuickFields}
          placeholder={copy.providerPlaceholder}
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
        <span>{copy.reference}</span>
        <input
          aria-label={copy.referenceFor({ title: bookingDoc.title })}
          className={bookingDocQuickFieldClassName}
          defaultValue={bookingDoc.confirmationCode ?? ""}
          disabled={!canEdit || !onChangeBookingDocQuickFields}
          placeholder={copy.referencePlaceholder}
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
  );
}
