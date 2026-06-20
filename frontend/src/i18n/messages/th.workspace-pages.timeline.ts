export const thTimelineMessages = {
  pageLabel: "ไทม์ไลน์ทริป",
  title: "ไทม์ไลน์",
  actionsLabel: "คำสั่งไทม์ไลน์",
  dayItems: ({ days, stops }: { days: number; stops: number }) => `${days} วัน / ${stops} จุด`,
  selectStop: ({ activity }: { activity: string }) => `เลือกจุดในไทม์ไลน์ ${activity}`,
} as const;
