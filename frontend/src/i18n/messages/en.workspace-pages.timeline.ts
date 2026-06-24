export const enTimelineMessages = {
  pageLabel: "Trip timeline",
  title: "Timeline",
  actionsLabel: "Timeline actions",
  dayItems: ({ days, stops }: { days: number; stops: number }) => `${days} days / ${stops} stops`,
  selectStop: ({ activity }: { activity: string }) => `Select timeline stop ${activity}`,
} as const;
