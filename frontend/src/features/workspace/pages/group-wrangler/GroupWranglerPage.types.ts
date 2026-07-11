import type { ActivityPoll } from "@/src/trip/polls";
import type { ActivityRsvp } from "@/src/trip/rsvp";
import type { SettlementSuggestion } from "@/src/trip/expenses/expense-types";
import type { Member } from "@/src/trip/members/member-types";
import type { ItineraryItem } from "@/src/trip/itinerary-core/itinerary-types";

export interface GroupWranglerPageProps {
  members: Member[];
  currentMember: Member;
  activities: ItineraryItem[];
  polls: ActivityPoll[];
  rsvps: ActivityRsvp[];
  settlementSuggestions: SettlementSuggestion[];
  inviteUrl: string;
  canManagePeople: boolean;
  onVote?: (activityId: string, optionId: string) => void;
  onToggleRsvp?: (activityId: string, status: import("@/src/trip/rsvp").RsvpStatus) => void;
  onCopyInviteLink?: () => void;
  onCloseInviteDialog?: () => void;
}
