import { useState } from "react";
import type { Locale } from "@/src/i18n/types";
import { updateFieldState } from "@/src/shared/form-state";
import type { BookingDoc, BookingDocType, ItineraryItem } from "@/src/trip/types";
import {
  buildTicketFormValues,
  type TicketFormValues,
} from "@/src/features/itinerary/domain/booking-ticket-form";

interface UseItineraryTicketFormValuesOptions {
  booking: BookingDoc | null;
  item: ItineraryItem;
  locale: Locale;
  type: BookingDocType;
}

export function useItineraryTicketFormValues({
  booking,
  item,
  locale,
  type,
}: UseItineraryTicketFormValuesOptions) {
  const [formValues, setFormValues] = useState<TicketFormValues>(() =>
    buildTicketFormValues({
      booking,
      item,
      locale,
      type,
    }),
  );

  function hydrateTicketFields(nextBooking: BookingDoc | null) {
    setFormValues(
      buildTicketFormValues({
        booking: nextBooking,
        item,
        locale,
        type,
      }),
    );
  }

  function updateTicketField<Field extends keyof TicketFormValues>(
    field: Field,
    value: TicketFormValues[Field],
  ) {
    setFormValues((current) => updateFieldState(current, field, value));
  }

  return {
    formValues,
    hydrateTicketFields,
    setConfirmationCode: (confirmationCode: string) =>
      updateTicketField("confirmationCode", confirmationCode),
    setEndsAt: (endsAt: string) => updateTicketField("endsAt", endsAt),
    setNotes: (notes: string) => updateTicketField("notes", notes),
    setProviderName: (providerName: string) =>
      updateTicketField("providerName", providerName),
    setRelatedItineraryItemIds: (updater: (current: string[]) => string[]) =>
      setFormValues((current) =>
        updateFieldState(
          current,
          "relatedItineraryItemIds",
          updater(current.relatedItineraryItemIds),
        ),
      ),
    setStartsAt: (startsAt: string) => updateTicketField("startsAt", startsAt),
    setTitle: (title: string) => updateTicketField("title", title),
  };
}
