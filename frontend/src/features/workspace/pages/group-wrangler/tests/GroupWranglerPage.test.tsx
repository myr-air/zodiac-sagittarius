import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { GroupWranglerPage } from "../GroupWranglerPage";
import type { Member } from "@/src/trip/members/member-types";
import type { ItineraryItem } from "@/src/trip/itinerary-core/itinerary-types";
import type { ActivityPoll } from "@/src/trip/polls";
import type { ActivityRsvp } from "@/src/trip/rsvp";
import type { SettlementSuggestion } from "@/src/trip/expenses/expense-types";

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

function makeItineraryItem(overrides: Partial<ItineraryItem> = {}): ItineraryItem {
  return {
    id: "activity-1",
    tripId: "trip-1",
    planVariantId: "plan-1",
    day: "2026-07-11",
    sortOrder: 0,
    startTime: "09:00",
    activity: "Hiking",
    activityType: "experience",
    place: "Mountain",
    linkLabel: "Map",
    mapLink: "https://map.example",
    durationMinutes: 120,
    transportation: "car",
    details: {},
    note: "",
    createdBy: "member-1",
    updatedAt: "2026-07-11T00:00:00Z",
    version: 1,
    ...overrides,
  } as ItineraryItem;
}

function makePoll(overrides: Partial<ActivityPoll> = {}): ActivityPoll {
  return {
    id: "poll-1",
    activityId: "activity-1",
    isOpen: true,
    createdBy: "member-1",
    options: [
      { id: "opt-1", label: "Morning", sortOrder: 0 },
      { id: "opt-2", label: "Afternoon", sortOrder: 1 },
    ],
    votes: [],
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

function makeSettlement(overrides: Partial<SettlementSuggestion> = {}): SettlementSuggestion {
  return {
    from: "member-1",
    to: "member-2",
    amount: 500,
    currency: "฿",
    ...overrides,
  };
}

describe("GroupWranglerPage", () => {
  it("renders members section with PersonAvatars", () => {
    const members = [makeMember({ id: "member-1", displayName: "Alice" })];
    renderWithI18n(
      <GroupWranglerPage
        members={members}
        currentMember={members[0]}
        activities={[]}
        polls={[]}
        rsvps={[]}
        settlementSuggestions={[]}
        inviteUrl="https://joii.app/invite/xyz"
        canManagePeople={false}
      />,
      { locale: "en" },
    );

    expect(screen.getByRole("region", { name: "Group Wrangler" })).toBeInTheDocument();
    expect(screen.getByTitle("Alice")).toBeInTheDocument();
  });

  it("renders invite button when canManagePeople is true", () => {
    const members = [makeMember()];
    renderWithI18n(
      <GroupWranglerPage
        members={members}
        currentMember={members[0]}
        activities={[]}
        polls={[]}
        rsvps={[]}
        settlementSuggestions={[]}
        inviteUrl="https://joii.app/invite/xyz"
        canManagePeople={true}
      />,
      { locale: "en" },
    );

    expect(
      within(screen.getByRole("region", { name: "Group Wrangler" })).getByRole(
        "button",
        { name: "Invite" },
      ),
    ).toBeInTheDocument();
  });

  it("does not render invite button when canManagePeople is false", () => {
    const members = [makeMember()];
    renderWithI18n(
      <GroupWranglerPage
        members={members}
        currentMember={members[0]}
        activities={[]}
        polls={[]}
        rsvps={[]}
        settlementSuggestions={[]}
        inviteUrl="https://joii.app/invite/xyz"
        canManagePeople={false}
      />,
      { locale: "en" },
    );

    expect(screen.queryByRole("button", { name: "Invite" })).not.toBeInTheDocument();
  });

  it("renders polls section", () => {
    const members = [makeMember()];
    const polls = [makePoll()];
    renderWithI18n(
      <GroupWranglerPage
        members={members}
        currentMember={members[0]}
        activities={[makeItineraryItem()]}
        polls={polls}
        rsvps={[]}
        settlementSuggestions={[]}
        inviteUrl="https://joii.app/invite/xyz"
        canManagePeople={true}
      />,
      { locale: "en" },
    );

    expect(screen.getByRole("region", { name: "Polls" })).toBeInTheDocument();
    expect(screen.getByText("Hiking")).toBeInTheDocument();
  });

  it("renders RSVP section", () => {
    const members = [makeMember()];
    const activities = [makeItineraryItem()];
    const rsvps = [makeRsvp()];
    renderWithI18n(
      <GroupWranglerPage
        members={members}
        currentMember={members[0]}
        activities={activities}
        polls={[]}
        rsvps={rsvps}
        settlementSuggestions={[]}
        inviteUrl="https://joii.app/invite/xyz"
        canManagePeople={true}
      />,
      { locale: "en" },
    );

    expect(screen.getByRole("region", { name: "RSVP" })).toBeInTheDocument();
    expect(screen.getByText("Hiking")).toBeInTheDocument();
  });

  it("renders expense settlement section", () => {
    const members = [makeMember(), makeMember({ id: "member-2", displayName: "Bob" })];
    renderWithI18n(
      <GroupWranglerPage
        members={members}
        currentMember={members[0]}
        activities={[]}
        polls={[]}
        rsvps={[]}
        settlementSuggestions={[makeSettlement()]}
        inviteUrl="https://joii.app/invite/xyz"
        canManagePeople={false}
      />,
      { locale: "en" },
    );

    expect(screen.getByRole("region", { name: "Expense Settlement" })).toBeInTheDocument();
    expect(screen.getByText("Alice → Bob: ฿500")).toBeInTheDocument();
  });

  it("shows empty members message when no members", () => {
    renderWithI18n(
      <GroupWranglerPage
        members={[]}
        currentMember={makeMember()}
        activities={[]}
        polls={[]}
        rsvps={[]}
        settlementSuggestions={[]}
        inviteUrl="https://joii.app/invite/xyz"
        canManagePeople={false}
      />,
      { locale: "en" },
    );

    expect(screen.getByText("No members yet")).toBeInTheDocument();
  });

  it("shows empty polls message when no polls", () => {
    const members = [makeMember()];
    renderWithI18n(
      <GroupWranglerPage
        members={members}
        currentMember={members[0]}
        activities={[]}
        polls={[]}
        rsvps={[]}
        settlementSuggestions={[]}
        inviteUrl="https://joii.app/invite/xyz"
        canManagePeople={false}
      />,
      { locale: "en" },
    );

    expect(screen.getByText("No polls yet")).toBeInTheDocument();
  });

  it("opens invite dialog when invite button clicked", () => {
    const members = [makeMember()];
    renderWithI18n(
      <GroupWranglerPage
        members={members}
        currentMember={members[0]}
        activities={[]}
        polls={[]}
        rsvps={[]}
        settlementSuggestions={[]}
        inviteUrl="https://joii.app/invite/xyz"
        canManagePeople={true}
      />,
      { locale: "en" },
    );

    fireEvent.click(
      within(screen.getByRole("region", { name: "Group Wrangler" })).getByRole(
        "button",
        { name: "Invite" },
      ),
    );
    expect(screen.getByRole("dialog", { name: "Invite Members" })).toBeInTheDocument();
  });
});
