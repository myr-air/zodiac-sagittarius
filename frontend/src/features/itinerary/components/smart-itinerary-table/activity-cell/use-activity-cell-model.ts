import { useState } from "react";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem } from "@/src/trip/types";
import type { InlineItineraryItemPatch } from "@/src/trip/itinerary-items";
import { itemStatusLabel } from "../smart-itinerary-table-labels";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import {
  activityCellActionsExpandedState,
  activityCellNoteTargetState,
  activityCellSubActivitiesToggledState,
  activityCellSubActivityModalState,
  initialActivityCellUiState,
} from "./activity-cell-ui-state";

interface UseActivityCellModelOptions {
  canEdit: boolean;
  item: ItineraryItem;
  locale: Locale;
  subItems: ItineraryItem[];
  onAddSubActivity?: (parentItemId: string) => ItineraryAsyncVoidResult;
  onUpdateItemInline?: ActivityInlineUpdateHandler;
}

type ActivityInlineUpdateHandler = (
  itemId: string,
  patch: InlineItineraryItemPatch,
) => ItineraryAsyncVoidResult;

export function useActivityCellModel({
  canEdit,
  item,
  locale,
  onAddSubActivity,
  onUpdateItemInline,
  subItems,
}: UseActivityCellModelOptions) {
  const editable = canEdit && Boolean(onUpdateItemInline);
  const status = item.status ? itemStatusLabel(item.status, locale) : null;
  const [uiState, setUiState] = useState(initialActivityCellUiState);
  const showSubActivityToggle =
    Boolean(onAddSubActivity) || subItems.length > 0;
  const actionMenuLabel =
    locale === "th"
      ? `จัดการกิจกรรม ${item.activity}`
      : `Activity actions for ${item.activity}`;

  function openNoteModal(target: ItineraryItem, compact = false) {
    setUiState((current) =>
      activityCellNoteTargetState(current, target, compact),
    );
  }

  function openSubActivityModal(compact = false) {
    setUiState((current) =>
      activityCellSubActivityModalState(current, true, compact),
    );
  }

  function toggleSubActivities(compact = false) {
    setUiState((current) =>
      activityCellSubActivitiesToggledState(current, compact),
    );
  }

  return {
    actionMenuLabel,
    actionsExpanded: uiState.actionsExpanded,
    editable,
    noteTarget: uiState.noteTarget,
    openNoteModal,
    openSubActivityModal,
    setActionsExpanded: (
      actionsExpanded: boolean | ((current: boolean) => boolean),
    ) => {
      setUiState((current) =>
        activityCellActionsExpandedState(current, actionsExpanded),
      );
    },
    setNoteTarget: (noteTarget: ItineraryItem | null) => {
      setUiState((current) => activityCellNoteTargetState(current, noteTarget));
    },
    setSubActivityModalOpen: (subActivityModalOpen: boolean) => {
      setUiState((current) =>
        activityCellSubActivityModalState(current, subActivityModalOpen),
      );
    },
    showSubActivityToggle,
    status,
    subActivitiesExpanded: uiState.subActivitiesExpanded,
    subActivityModalOpen: uiState.subActivityModalOpen,
    toggleSubActivities,
  };
}
