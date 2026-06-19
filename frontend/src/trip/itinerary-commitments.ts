export interface ItineraryCommitmentSummary {
  bookingCount?: number;
  expenseCount?: number;
  noteCount?: number;
  openTaskCount?: number;
}

interface BuildItineraryCommitmentsInput {
  bookingDocs: Array<{ relatedItineraryItemIds: string[] }>;
  expenses: Array<{ itineraryItemId?: string | null }>;
  stopNotes: Array<{ itemId: string }>;
  tasks: Array<{ relatedItemId?: string | null; status: string }>;
}

export function buildItineraryCommitmentsByItemId({
  bookingDocs,
  expenses,
  stopNotes,
  tasks,
}: BuildItineraryCommitmentsInput): Record<string, ItineraryCommitmentSummary> {
  const commitments = new Map<string, ItineraryCommitmentSummary>();
  const ensure = (itemId: string) => {
    const current = commitments.get(itemId) ?? {};
    commitments.set(itemId, current);
    return current;
  };

  for (const booking of bookingDocs) {
    for (const itemId of booking.relatedItineraryItemIds) {
      const current = ensure(itemId);
      current.bookingCount = (current.bookingCount ?? 0) + 1;
    }
  }
  for (const expense of expenses) {
    if (!expense.itineraryItemId) continue;
    const current = ensure(expense.itineraryItemId);
    current.expenseCount = (current.expenseCount ?? 0) + 1;
  }
  for (const task of tasks) {
    if (!task.relatedItemId || task.status === "done") continue;
    const current = ensure(task.relatedItemId);
    current.openTaskCount = (current.openTaskCount ?? 0) + 1;
  }
  for (const note of stopNotes) {
    const current = ensure(note.itemId);
    current.noteCount = (current.noteCount ?? 0) + 1;
  }

  return Object.fromEntries(commitments);
}
