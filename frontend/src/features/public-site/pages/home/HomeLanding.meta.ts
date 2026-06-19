export const workflowStepMeta = [
  {
    key: "invite",
    icon: "users",
    tone: "coral",
  },
  {
    key: "plan",
    icon: "list",
    tone: "sand",
  },
  {
    key: "travel",
    icon: "wallet",
    tone: "sky",
  },
] satisfies Array<{ key: "invite" | "plan" | "travel"; icon: "users" | "list" | "wallet"; tone: "coral" | "sand" | "sky" }>;

export const previewDayKeys = ["first", "second", "third"] as const;
export const checklistKeys = ["flights", "hotel", "cash", "packing"] as const;
export const checkedChecklistKeys = new Set<(typeof checklistKeys)[number]>(["flights", "hotel", "cash"]);
