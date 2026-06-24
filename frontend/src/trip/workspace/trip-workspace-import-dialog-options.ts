import type { ItineraryImportApplyTarget } from "@/src/trip/itinerary-paths";

export interface TripWorkspaceImportDialogOption<Value extends string> {
  value: Value;
  label: string;
}

export const tripWorkspaceImportScopeOptions: readonly TripWorkspaceImportDialogOption<
  ItineraryImportApplyTarget["scope"]
>[] = [
  { value: "trip", label: "Whole trip" },
  { value: "day", label: "This day only" },
];

export const tripWorkspaceImportModeOptions: readonly TripWorkspaceImportDialogOption<
  ItineraryImportApplyTarget["mode"]
>[] = [
  { value: "replace-target", label: "Replace target path" },
  { value: "keep-alternatives", label: "Keep both as alternatives" },
];

export const tripWorkspaceImportRecordModeOptions: readonly TripWorkspaceImportDialogOption<
  ItineraryImportApplyTarget["recordMode"]
>[] = [
  { value: "clone-linked", label: "Clone linked records" },
  { value: "activities-only", label: "Activities only" },
];
