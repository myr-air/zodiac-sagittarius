import { describe, expect, it, vi } from "vitest";
import type { ItineraryItem, Member, TripTask } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import {
  buildDestinationVisual,
  buildHighlightItems,
  getCountdownBadge,
  getHighlightImage,
  highlightTone,
  isMyTask,
  overviewRoleLens,
  photoBoardEmptyMessage,
  stopLabel,
  taskKindLabel,
  travelerNextStopDetail,
  viewerNextStopDetail,
  managerNextStopDetail,
} from "./overview";

describe("overview domain helpers", () => {
  it("derives role lens from member role", () => {
    const owner = { id: "m1", displayName: "Owner", role: "owner", presence: "online", color: "#000" } as Member;
    const traveler = { id: "m2", displayName: "Traveler", role: "traveler", presence: "online", color: "#000" } as Member;
    const viewer = { id: "m3", displayName: "Viewer", role: "viewer", presence: "online", color: "#000" } as Member;

    expect(overviewRoleLens(owner)).toBe("manager");
    expect(overviewRoleLens(traveler)).toBe("traveler");
    expect(overviewRoleLens(viewer)).toBe("viewer");
  });

  it("resolves stop label and task details", () => {
    const items: ItineraryItem[] = [
      {
        id: "a1",
        tripId: "t1",
        planVariantId: "p1",
        day: "2026-06-19",
        sortOrder: 100,
        startTime: "09:00",
        activity: "Breakfast",
        activityType: "food",
        place: "Lan Kwai Fong",
        linkLabel: "Map",
        mapLink: "https://maps.example",
        durationMinutes: null,
        transportation: "MTR",
        details: {},
        note: "Bring cash",
        createdBy: "m1",
        updatedAt: "2026-06-19T09:00:00.000Z",
        version: 1,
      },
    ];

    expect(stopLabel("missing", items, "No stop")).toBe("No stop");
    expect(stopLabel("a1", items, "No stop")).toBe("Breakfast");

    expect(travelerNextStopDetail(items[0], "fallback")).toBe("MTR");
    expect(viewerNextStopDetail(items[0], "fallback")).toBe("MTR");
    expect(managerNextStopDetail(items[0], "fallback")).toBe("MTR");
    expect(travelerNextStopDetail({ ...items[0], note: "", transportation: "" }, "fallback")).toBe("fallback");
  });

  it("classifies task ownership and labels", () => {
    const booking = { kind: "booking", createdBy: "m1", assigneeId: "m2", title: "book hotel" } as TripTask;
    const prep = { kind: "prep", createdBy: "m2", assigneeId: null, title: "Pack clothes" } as TripTask;
    const thaiBooking = { kind: "prep", createdBy: "m2", assigneeId: null, title: "จองโรงแรม" } as TripTask;
    const linkedTask = { kind: "prep", createdBy: "m2", assigneeId: null, relatedItemId: "i1", title: "Reserve taxi" } as TripTask;
    const labels = { booking: "Booking", prep: "Prep" };

    expect(taskKindLabel(booking, labels)).toBe("Booking");
    expect(taskKindLabel(prep, labels)).toBe("Prep");
    expect(taskKindLabel(thaiBooking, labels)).toBe("Booking");
    expect(taskKindLabel(linkedTask, labels)).toBe("Booking");

    expect(isMyTask(booking, "m1")).toBe(true);
    expect(isMyTask(prep, "m1")).toBe(false);
    expect(isMyTask(prep, "m2")).toBe(true);
  });

  it("builds destination visuals from destination label heuristics", () => {
    const harbor = buildDestinationVisual("Night in Hong Kong");
    const coast = buildDestinationVisual("Bali beach retreat");
    const market = buildDestinationVisual("Bangkok night market");
    const city = buildDestinationVisual("Kyoto");

    expect(harbor.tone).toBe("harbor");
    expect(coast.tone).toBe("coast");
    expect(market.tone).toBe("market");
    expect(city.tone).toBe("city");
  });

  it("builds highlight image from activity and type", () => {
    const food = {
      id: "food",
      tripId: "t1",
      planVariantId: "p1",
      day: "2026-06-19",
      sortOrder: 100,
      startTime: "10:00",
      activity: "Brunch at cafe",
      activityType: "food",
      place: "Lan",
      linkLabel: "Map",
      mapLink: "",
      durationMinutes: 60,
      transportation: "Walk",
      details: {},
      note: "",
      createdBy: "m1",
      updatedAt: "2026-06-19",
      version: 1,
    } as ItineraryItem;

    const shopping = {
      ...food,
      id: "shop",
      activityType: "shopping",
      activity: "Mong Kok market run",
    } as ItineraryItem;

    const attraction = {
      ...food,
      id: "at",
      activityType: "attraction",
      activity: "Victoria Peak",
    } as ItineraryItem;

    const stay = {
      ...food,
      id: "stay",
      activityType: "stay",
      activity: "Hotel",
    } as ItineraryItem;

    expect(getHighlightImage(food)).toBe("/landing/auth/photo-dim-sum-brunch.png");
    expect(getHighlightImage(shopping)).toBe("/landing/auth/photo-mong-kok-market.png");
    expect(getHighlightImage(attraction)).toBe("/landing/auth/photo-hong-kong-skyline.png");
    expect(typeof getHighlightImage(stay)).toBe("string");
  });

  it("builds highlight list preferring activity types and fallback to non-travel", () => {
    const items: ItineraryItem[] = [
      { id: "a", tripId: "t1", planVariantId: "p1", day: "2026-06-19", sortOrder: 1, startTime: "09:00", activity: "Travel", activityType: "travel", place: "Airport", linkLabel: "M", mapLink: "", durationMinutes: null, transportation: "", details: {}, note: "", createdBy: "m1", updatedAt: "", version: 1 },
      { id: "b", tripId: "t1", planVariantId: "p1", day: "2026-06-19", sortOrder: 2, startTime: "10:00", activity: "Lunch", activityType: "food", place: "A", linkLabel: "M", mapLink: "", durationMinutes: 45, transportation: "", details: {}, note: "", createdBy: "m1", updatedAt: "", version: 1 },
      { id: "c", tripId: "t1", planVariantId: "p1", day: "2026-06-19", sortOrder: 3, startTime: "11:00", activity: "Museum", activityType: "attraction", place: "B", linkLabel: "M", mapLink: "", durationMinutes: 60, transportation: "", details: {}, note: "", createdBy: "m1", updatedAt: "", version: 1 },
      { id: "d", tripId: "t1", planVariantId: "p1", day: "2026-06-19", sortOrder: 4, startTime: "12:00", activity: "Shop", activityType: "shopping", place: "C", linkLabel: "M", mapLink: "", durationMinutes: 30, transportation: "", details: {}, note: "", createdBy: "m1", updatedAt: "", version: 1 },
      { id: "e", tripId: "t1", planVariantId: "p1", day: "2026-06-19", sortOrder: 5, startTime: "13:00", activity: "Hotel", activityType: "stay", place: "D", linkLabel: "M", mapLink: "", durationMinutes: 60, transportation: "", details: {}, note: "", createdBy: "m1", updatedAt: "", version: 1 },
    ];

    const withPreferred = buildHighlightItems(items);
    expect(withPreferred.map((item) => item.id)).toEqual(["b", "c", "d"]);

    const noPreferred = buildHighlightItems([
      items[0],
      { ...items[4], id: "f" },
    ]);

    expect(noPreferred).toHaveLength(1);
    expect(noPreferred[0]!.id).toBe("f");
  });

  it("translates empty photo board copy and computes highlight tone", () => {
    expect(photoBoardEmptyMessage("ยังไม่มีไฮไลต์ในแผนนี้")).toBe("ยังไม่มีภาพไฮไลต์ในแผนนี้");
    expect(photoBoardEmptyMessage("No highlights in this plan yet.")).toBe("No photo highlights in this plan yet.");
    expect(photoBoardEmptyMessage("No data")).toBe("No data");

    const food: ItineraryItem = {
      ...items()[0],
      activityType: "food",
      id: "h1",
    };
    const attraction: ItineraryItem = {
      ...items()[0],
      activityType: "attraction",
      id: "h2",
    };
    const stay: ItineraryItem = {
      ...items()[0],
      activityType: "stay",
      id: "h3",
    };

    expect(highlightTone(food, 0)).toBe("market");
    expect(highlightTone(attraction, 0)).toBe("harbor");
    expect(highlightTone(attraction, 1)).toBe("city");
    expect(highlightTone(stay, 0)).toBe("coast");
  });

  it("computes countdown badge for incoming, active, and completed trips", () => {
    const localeEn: Locale = "en";
    const localeTh: Locale = "th";
    vi.useFakeTimers({ now: new Date("2026-06-19T12:00:00.000Z") });

    expect(getCountdownBadge("2026-06-21", "2026-06-25", localeTh)).toMatchObject({
      type: "incoming",
      text: "จะเริ่มในอีก 2 วัน",
    });
    expect(getCountdownBadge("2026-06-18", "2026-06-21", localeEn)).toMatchObject({
      type: "active",
      text: "Day 2 of 4",
    });
    expect(getCountdownBadge("2026-05-01", "2026-05-10", localeEn)).toMatchObject({
      type: "completed",
      text: "Trip Completed",
    });

    vi.useRealTimers();
  });
});

function items(): ItineraryItem[] {
  return [
    {
      id: "sample",
      tripId: "t1",
      planVariantId: "p1",
      day: "2026-06-19",
      sortOrder: 100,
      startTime: "09:00",
      activity: "Sample",
      activityType: "food",
      place: "Place",
      linkLabel: "Map",
      mapLink: "https://maps.example",
      durationMinutes: 60,
      transportation: "Walk",
      details: {},
      note: "",
      createdBy: "m1",
      updatedAt: "2026-06-19",
      version: 1,
    },
  ];
}
