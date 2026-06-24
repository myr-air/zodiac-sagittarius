import { findItineraryItemById } from "../itinerary-items/itinerary-item-lookup";
import type { ItineraryItem, ValidationWarning } from "../types";
import { getTimeWindowInterval } from "./itinerary-time-window-interval";

export function validateHierarchyFields(item: ItineraryItem, dayItems: ItineraryItem[]): ValidationWarning[] {
  if (!item.parentItemId) return [];
  const parent = findItineraryItemById(dayItems, item.parentItemId);
  if (!parent) {
    return [{
      code: "missing-parent-item",
      message: "This sub-activity is linked to a parent that is not in this day plan.",
      itemId: item.id,
    }];
  }

  const warnings: ValidationWarning[] = [];
  if (parent.parentItemId) {
    warnings.push({
      code: "nested-sub-activity",
      message: "Sub-activities can only sit under an activity block, not under another sub-activity.",
      itemId: item.id,
    });
  }

  if (!parent.isPlanBlock) {
    warnings.push({
      code: "invalid-parent-plan-block",
      message: "Move this sub-activity under an activity block or promote its parent to a block.",
      itemId: item.id,
    });
  }

  if (item.day !== parent.day || item.planVariantId !== parent.planVariantId) {
    warnings.push({
      code: "parent-scope-mismatch",
      message: "Sub-activities must stay in the same day and Trip Plan as their parent block.",
      itemId: item.id,
    });
  }

  if (warnings.length > 0 || item.timeMode === "flexible" || parent.timeMode === "flexible") {
    return warnings;
  }

  const parentInterval = getTimeWindowInterval(parent);
  const childInterval = getTimeWindowInterval(item);
  if (!parentInterval || !childInterval) return warnings;

  if (childInterval.start < parentInterval.start || childInterval.end > parentInterval.end) {
    warnings.push({
      code: "child-outside-plan-block",
      message: `This child item sits outside ${parent.activity}; adjust the time or move it out of the block.`,
      itemId: item.id,
    });
  }
  return warnings;
}
