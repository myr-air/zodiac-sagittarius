import { formatDayLabel } from "@/src/trip/itinerary-core";
import { formatThaiDate } from "@/src/features/itinerary/lib/itinerary-display";
import type { Locale } from "@/src/i18n/types";
import type {
  StopDetailType,
  stopDetailLabels,
} from "@/src/features/itinerary/domain/stop-details";
import type { StopManualPathOption } from "./stop-dialog.types";

export interface StopDialogSelectOption<Value extends string = string> {
  value: Value;
  label: string;
}

export function stopDialogValueSelectOptions<Value extends string>(
  values: readonly Value[],
): StopDialogSelectOption<Value>[] {
  return values.map((value) => ({ value, label: value }));
}

export function stopDialogDaySelectOptions({
  days,
  locale,
  startDate,
}: {
  days: readonly string[];
  locale: Locale;
  startDate?: string;
}): StopDialogSelectOption[] {
  return days.map((day) => ({
    value: day,
    label: `${formatDayLabel(day, startDate ?? day, locale)} · ${formatThaiDate(day, locale)}`,
  }));
}

export function stopDialogPathSelectOptions(
  pathOptions: readonly StopManualPathOption[],
): StopDialogSelectOption[] {
  return pathOptions.map((option) => ({ value: option.id, label: option.name }));
}

export function stopDialogDetailTypeSelectOptions({
  detailLabels,
  detailTypeOptions,
}: {
  detailLabels: ReturnType<typeof stopDetailLabels>;
  detailTypeOptions: readonly StopDetailType[];
}): StopDialogSelectOption<StopDetailType>[] {
  return detailTypeOptions.map((value) => ({
    value,
    label: detailLabels.types[value],
  }));
}
