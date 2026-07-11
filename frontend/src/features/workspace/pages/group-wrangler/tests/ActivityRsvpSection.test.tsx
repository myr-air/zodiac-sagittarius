import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { ActivityRsvpSection } from "../ActivityRsvpSection";
import type { Member } from "@/src/trip/members/member-types";
import type { ActivityRsvp } from "@/src/trip/rsvp";

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: "member-1",
    displayName: "Alice",
    role: "traveler",
    presence: "offline",
    color: "#14b8a6",
    ...overrides,
  };
}

function makeRsvp(overrides: Partial<ActivityRsvp> = {}): ActivityRsvp {
  return {
    activityId: "activity-1",
    memberId: "member-1",
    status: "going",
    updatedAt: "2026-07-11T00:00:00Z",
    ...overrides,
  };
}

describe("ActivityRsvpSection", () => {
  const baseProps = {
    activityName: "Hiking",
    members: [makeMember({ id: "member-1", displayName: "Alice" }), makeMember({ id: "member-2", displayName: "Bob" })],
    currentMemberId: "member-1",
    headcountLabel: (going: number, total: number) => `${going}/${total} going`,
    goingLabel: "Going",
    notGoingLabel: "Not going",
  };

  it("renders member RSVP statuses with PersonAvatars", () => {
    const rsvps = [makeRsvp({ memberId: "member-1", status: "going" }), makeRsvp({ memberId: "member-2", status: "not-going" })];
    renderWithI18n(<ActivityRsvpSection {...baseProps} rsvps={rsvps} />, { locale: "en" });

    expect(screen.getByTitle("Alice")).toBeInTheDocument();
    expect(screen.getByTitle("Bob")).toBeInTheDocument();
    expect(screen.getByText("Going")).toBeInTheDocument();
    expect(screen.getByText("Not going")).toBeInTheDocument();
  });

  it("shows headcount label", () => {
    const rsvps = [makeRsvp({ memberId: "member-1", status: "going" }), makeRsvp({ memberId: "member-2", status: "not-going" })];
    renderWithI18n(<ActivityRsvpSection {...baseProps} rsvps={rsvps} />, { locale: "en" });

    expect(screen.getByText("1/2 going")).toBeInTheDocument();
  });

  it("toggle Going button works", () => {
    const onToggleRsvp = vi.fn();
    const rsvps = [makeRsvp({ memberId: "member-1", status: "not-going" })];
    renderWithI18n(<ActivityRsvpSection {...baseProps} rsvps={rsvps} onToggleRsvp={onToggleRsvp} />, { locale: "en" });

    fireEvent.click(screen.getByRole("button", { name: "Going" }));
    expect(onToggleRsvp).toHaveBeenCalledWith("going");
  });

  it("toggle Not going button works", () => {
    const onToggleRsvp = vi.fn();
    const rsvps = [makeRsvp({ memberId: "member-1", status: "going" })];
    renderWithI18n(<ActivityRsvpSection {...baseProps} rsvps={rsvps} onToggleRsvp={onToggleRsvp} />, { locale: "en" });

    fireEvent.click(screen.getByRole("button", { name: "Not going" }));
    expect(onToggleRsvp).toHaveBeenCalledWith("not-going");
  });

  it("shows current member toggle buttons", () => {
    const rsvps = [makeRsvp({ memberId: "member-1", status: "going" })];
    renderWithI18n(<ActivityRsvpSection {...baseProps} rsvps={rsvps} onToggleRsvp={vi.fn()} />, { locale: "en" });

    expect(screen.getByRole("button", { name: "Going" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Not going" })).toBeInTheDocument();
  });
});
