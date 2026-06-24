import type { BookingDoc } from "@/src/trip/types";
import {
  buildBookingDocQuickFieldPatch,
  type BookingDocQuickFieldKey,
  type BookingDocQuickFieldsPatch,
} from "@/src/trip/booking-docs";

export interface ContextRailBookingDocQuickFieldCopy {
  ariaLabel: (input: { title: string }) => string;
  label: string;
  placeholder: string;
}

export interface ContextRailBookingDocQuickFieldCopyInput {
  provider: string;
  providerFor: (input: { title: string }) => string;
  providerPlaceholder: string;
  reference: string;
  referenceFor: (input: { title: string }) => string;
  referencePlaceholder: string;
}

export function bookingDocQuickFieldCopy(
  copy: ContextRailBookingDocQuickFieldCopyInput,
  key: BookingDocQuickFieldKey,
): ContextRailBookingDocQuickFieldCopy {
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

export function getBookingDocQuickFieldDraftValue(
  target: HTMLInputElement,
): string {
  return (target.dataset.draftValue ?? target.value).trim();
}

export function shouldCommitBookingDocQuickField(
  key?: string,
): boolean {
  return !key || key === "Enter";
}

export function bookingDocQuickFieldPatchFromDraft({
  bookingDoc,
  key,
  target,
}: {
  bookingDoc: BookingDoc;
  key: BookingDocQuickFieldKey;
  target: HTMLInputElement;
}): BookingDocQuickFieldsPatch | null {
  return buildBookingDocQuickFieldPatch(
    bookingDoc,
    key,
    getBookingDocQuickFieldDraftValue(target),
  );
}
