export const enSuggestionsMessages = {
  queueLabel: "Suggestion queue",
  title: ({ count }: { count: number }) => `Suggestions (${count})`,
  seeMore: "See more",
  fallback: "Suggest booking ahead",
  suggestedUpdate: ({ name }: { name: string }) => `${name} suggested an update`,
} as const;
