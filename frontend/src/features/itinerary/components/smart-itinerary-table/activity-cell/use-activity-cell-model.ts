import { useState } from "react";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem } from "@/src/trip/types";
import type { InlineItineraryItemPatch } from "../../../lib/inline-itinerary-item-patch";
import { itemStatusLabel } from "../smart-itinerary-table-utils";

interface UseActivityCellModelOptions {
  canEdit: boolean;
  item: ItineraryItem;
  locale: Locale;
  subItems: ItineraryItem[];
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onUpdateItemInline?: ActivityInlineUpdateHandler;
}

type ActivityInlineUpdateHandler = (
  itemId: string,
  patch: InlineItineraryItemPatch,
) => void | Promise<void>;

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
  const [subActivityModalOpen, setSubActivityModalOpen] = useState(false);
  const [subActivitiesExpanded, setSubActivitiesExpanded] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [noteTarget, setNoteTarget] = useState<ItineraryItem | null>(null);
  const showSubActivityToggle =
    Boolean(onAddSubActivity) || subItems.length > 0;
  const actionMenuLabel =
    locale === "th"
      ? `จัดการกิจกรรม ${item.activity}`
      : `Activity actions for ${item.activity}`;

  function openNoteModal(target: ItineraryItem, compact = false) {
    if (compact) {
      setActionsExpanded(false);
    }
    setNoteTarget(target);
  }

  function openSubActivityModal(compact = false) {
    if (compact) {
      setActionsExpanded(false);
    }
    setSubActivityModalOpen(true);
  }

  function toggleSubActivities(compact = false) {
    if (compact) {
      setActionsExpanded(false);
    }
    setSubActivitiesExpanded((current) => !current);
  }

  return {
    actionMenuLabel,
    actionsExpanded,
    editable,
    noteTarget,
    openNoteModal,
    openSubActivityModal,
    setActionsExpanded,
    setNoteTarget,
    setSubActivityModalOpen,
    showSubActivityToggle,
    status,
    subActivitiesExpanded,
    subActivityModalOpen,
    toggleSubActivities,
  };
}
