export type RsvpStatus = "going" | "not-going";

export interface ActivityRsvp {
  activityId: string;
  memberId: string;
  status: RsvpStatus;
  updatedAt: string;
}

export interface Headcount {
  activityId: string;
  going: number;
  notGoing: number;
  total: number;
  members: { memberId: string; status: RsvpStatus }[];
}
