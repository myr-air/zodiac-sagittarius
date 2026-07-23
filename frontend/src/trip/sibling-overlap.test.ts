import { describe, expect, it } from "vitest";
import {
  findOverlappingSiblingIds,
  type SiblingOverlapInput,
} from "./sibling-overlap";

/**
 * T3 #1 — pure sibling time-window overlap helper.
 * Same-day siblings (shared parentItemId, including both-null roots) whose
 * start/end windows intersect are flagged; non-overlapping siblings stay clear.
 * endOffsetDays extends end into later calendar days (minutes + N*24h).
 */

const DAY = "2026-07-22";

function stop(
  overrides: Partial<SiblingOverlapInput> &
    Pick<SiblingOverlapInput, "id" | "startTime" | "endTime">,
): SiblingOverlapInput {
  return {
    day: DAY,
    parentItemId: null,
    endOffsetDays: 0,
    ...overrides,
  };
}

describe("findOverlappingSiblingIds", () => {
  it("flags same-day siblings whose start/end windows intersect (including endOffsetDays); non-overlapping siblings stay clear", () => {
    // --- Happy overlap: 09:00–11:00 ∩ 10:00–12:00 ---
    const morningMuseum = stop({
      id: "item-museum",
      startTime: "09:00",
      endTime: "11:00",
    });
    const morningCafe = stop({
      id: "item-cafe",
      startTime: "10:00",
      endTime: "12:00",
    });

    expect(
      [...findOverlappingSiblingIds([morningMuseum, morningCafe])].sort(),
    ).toEqual(["item-cafe", "item-museum"]);

    // --- Clear: abutting 09:00–10:00 then 10:00–11:00 (no intersection) ---
    const transfer = stop({
      id: "item-transfer",
      startTime: "09:00",
      endTime: "10:00",
    });
    const hotelCheckIn = stop({
      id: "item-hotel",
      startTime: "10:00",
      endTime: "11:00",
    });

    expect(findOverlappingSiblingIds([transfer, hotelCheckIn])).toEqual(
      new Set(),
    );

    // --- endOffsetDays: overnight window intersects a late same-day sibling ---
    // 20:00 → 02:00 next day (+1) covers 21:00–22:00 on the start day.
    const overnightTrain = stop({
      id: "item-overnight-train",
      startTime: "20:00",
      endTime: "02:00",
      endOffsetDays: 1,
    });
    const lateSnack = stop({
      id: "item-late-snack",
      startTime: "21:00",
      endTime: "22:00",
    });

    expect(
      [...findOverlappingSiblingIds([overnightTrain, lateSnack])].sort(),
    ).toEqual(["item-late-snack", "item-overnight-train"]);
  });
});
