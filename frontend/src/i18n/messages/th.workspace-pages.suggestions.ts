export const thSuggestionsMessages = {
  queueLabel: "คิวข้อเสนอ",
  title: ({ count }: { count: number }) => `คำแนะนำ (${count})`,
  seeMore: "ดูเพิ่มเติม",
  fallback: "แนะนำให้จองคิวล่วงหน้า",
  suggestedUpdate: ({ name }: { name: string }) => `${name} เสนอการปรับแผน`,
} as const;
