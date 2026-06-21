import { describe, expect, it } from "vitest";
import type { ItineraryItem, Member, TripTask } from "@/src/trip/types";
import {
  isMyTask,
  managerNextStopDetail,
  overviewRoleLens,
  overviewRoleLensValues,
  stopLabel,
  taskKindLabel,
  travelerNextStopDetail,
  viewerNextStopDetail,
} from "../overview-roles";
import { overviewItem } from "./overview.test-support";

describe("overview role helpers", () => {
  it("keeps role lenses in summary display order", () => {
    expect(overviewRoleLensValues).toEqual(["manager", "traveler", "viewer"]);
  });

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
      overviewItem({
        id: "a1",
        activity: "Breakfast",
        place: "Lan Kwai Fong",
        transportation: "MTR",
        note: "Bring cash",
      }),
    ];

    expect(stopLabel("missing", items, "No stop")).toBe("No stop");
    expect(stopLabel("a1", items, "No stop")).toBe("Breakfast");

    expect(travelerNextStopDetail(items[0]!, "fallback")).toBe("MTR");
    expect(viewerNextStopDetail(items[0]!, "fallback")).toBe("MTR");
    expect(managerNextStopDetail(items[0]!, "fallback")).toBe("MTR");
    expect(travelerNextStopDetail({ ...items[0]!, note: "", transportation: "" }, "fallback")).toBe("fallback");
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
});
