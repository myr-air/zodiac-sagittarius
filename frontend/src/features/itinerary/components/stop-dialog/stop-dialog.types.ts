import type {
  ItineraryItem,
  PlaceResolutionCandidate,
} from "@/src/trip/types";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import type { StopFormValues } from "../../domain/stop-form-values";
import type {
  StopDetailType,
  StopDetailValues,
} from "./stop-dialog.utils";
import { stopDetailLabels } from "./stop-dialog.utils";
import type { StopDialogModel } from "./use-stop-dialog-model";

export type { StopFormValues };

export interface StopManualPathOption {
  id: string;
  name: string;
}

export interface StopDialogProps {
  mode: "create" | "edit";
  endDate?: string;
  initialDay?: string;
  initialItem?: ItineraryItem;
  initialParentItemId?: string | null;
  manualPathOptions?: StopManualPathOption[];
  onClose: () => void;
  onDelete?: () => void;
  onPromoteFoodRecommendation?: () => void;
  onSubmit: (values: StopFormValues) => void | Promise<void>;
  placeResolution?: {
    state: "idle" | "resolving" | "ambiguous" | "unresolved";
    candidates: PlaceResolutionCandidate[];
  };
  startDate?: string;
}

export type StopFormUpdateHandler = <K extends keyof StopFormValues>(
  key: K,
  value: StopFormValues[K],
) => void;

export type StopDetailUpdateHandler = <
  K extends keyof StopDetailValues,
>(
  key: K,
  value: StopDetailValues[K],
) => void;

export interface StopDialogFormFieldsProps {
  dayOptions: string[];
  detailLabels: ReturnType<typeof stopDetailLabels>;
  locale: Locale;
  manualPathOptions: StopManualPathOption[];
  mode: StopDialogProps["mode"];
  model: StopDialogModel;
  moreDetailsLabel: string;
  placeResolution: StopDialogProps["placeResolution"];
  startDate?: string;
  stopDialogMessages: Messages["stopDialog"];
  itineraryHeaders: Messages["itinerary"]["headers"];
}

export interface StopDialogPrimaryFieldsProps {
  activityLabel: string;
  detailType: StopDetailType;
  isFocusedEdit: boolean;
  noteLabel: string;
  placeLabel: string;
  transportationLabel: string;
  values: StopFormValues;
  onUpdate: StopFormUpdateHandler;
  onUpdateActivity: (activity: string) => void;
}

export interface StopDetailFieldsProps {
  detailLabels: ReturnType<typeof stopDetailLabels>;
  detailType: StopDetailType;
  detailValues: StopDetailValues;
  updateDetail: StopDetailUpdateHandler;
}
