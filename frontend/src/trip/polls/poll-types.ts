export interface PollOption {
  id: string;
  label: string;
  sortOrder: number;
}

export interface ActivityVote {
  activityId: string;
  memberId: string;
  selectedOptionId: string;
  votedAt: string;
}

export interface ActivityPoll {
  id: string;
  activityId: string;
  isOpen: boolean;
  createdBy: string;
  options: PollOption[];
  votes: ActivityVote[];
}
