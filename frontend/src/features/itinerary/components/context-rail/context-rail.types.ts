import type { BookingDocQuickFieldsPatch } from "@/src/trip/booking-docs";
import type {
  BookingDoc,
  BookingDocType,
  Expense,
  ExpenseSummary,
  ItineraryItem,
  Member,
  StopNote,
  Suggestion,
  SuggestionReviewDecision,
  Trip,
  TripTask,
} from "@/src/trip/types";
import type { ContextRailTab } from "./context-rail.utils";

export type ContextRailBookingDocQuickFieldsPatch = BookingDocQuickFieldsPatch;

export type ContextRailBookingDocTypeChangeHandler = (
  bookingDocId: string,
  type: BookingDocType,
) => void | Promise<void>;

export type ContextRailBookingDocQuickFieldsChangeHandler = (
  bookingDocId: string,
  patch: ContextRailBookingDocQuickFieldsPatch,
) => void | Promise<void>;

export type ContextRailCreateNoteInput = {
  itemId: string;
  body: string;
};

export type ContextRailUpdateNoteInput = {
  noteId: string;
  body: string;
};

export type ContextRailCreateExpenseInput = {
  itemId: string | null;
  title: string;
  amount: number;
  paidBy: string;
  category: Expense["category"];
};

export type ContextRailUpdateExpenseInput = {
  expenseId: string;
  title: string;
  amount: number;
  paidBy: string;
  category: Expense["category"];
};

export interface ContextRailNoteHandlers {
  onCreateNote: (input: ContextRailCreateNoteInput) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateNote: (input: ContextRailUpdateNoteInput) => void;
}

export interface ContextRailExpenseHandlers {
  onCreateExpense: (input: ContextRailCreateExpenseInput) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateExpense: (input: ContextRailUpdateExpenseInput) => void;
}

export interface ContextRailBookingDocHandlers {
  onChangeBookingDocType?: ContextRailBookingDocTypeChangeHandler;
  onChangeBookingDocQuickFields?: ContextRailBookingDocQuickFieldsChangeHandler;
}

export interface ContextRailProps
  extends ContextRailNoteHandlers,
    ContextRailExpenseHandlers,
    ContextRailBookingDocHandlers {
  trip: Trip;
  selectedItem?: ItineraryItem;
  suggestions: Suggestion[];
  stopNotes: StopNote[];
  tasks: TripTask[];
  bookingDocs: BookingDoc[];
  currentMember: Member;
  expenseSummary: ExpenseSummary;
  canEdit: boolean;
  canCreateNote: boolean;
  canCreateSuggestion: boolean;
  canReviewSuggestions: boolean;
  canEditExpenses: boolean;
  open: boolean;
  preferredTab?: ContextRailTab;
  onEditSelected: () => void;
  onReviewSuggestion: (
    suggestionId: string,
    decision: SuggestionReviewDecision,
  ) => void;
  onSuggestSelected: () => void;
  onToggleTaskStatus: (taskId: string) => void;
  onClose: () => void;
}

export interface ContextRailSelectedStopPanelProps
  extends ContextRailNoteHandlers,
    ContextRailExpenseHandlers,
    ContextRailBookingDocHandlers {
  selectedItem: ItineraryItem;
  currentMember: Member;
  trip: Trip;
  selectedAdvisories: NonNullable<ItineraryItem["advisories"]>;
  selectedNotes: StopNote[];
  selectedExpenses: Expense[];
  selectedTasks: TripTask[];
  selectedBookingDocs: BookingDoc[];
  selectedSuggestions: Suggestion[];
  expenseSummary: ExpenseSummary;
  canEdit: boolean;
  canCreateNote: boolean;
  canCreateSuggestion: boolean;
  canReviewSuggestions: boolean;
  canEditExpenses: boolean;
  activeTab: ContextRailTab;
  onActiveTabChange: (tab: ContextRailTab) => void;
  onClose: () => void;
  onEditSelected: () => void;
  onSuggestSelected: () => void;
  onToggleTaskStatus: (taskId: string) => void;
  onReviewSuggestion: (
    suggestionId: string,
    decision: SuggestionReviewDecision,
  ) => void;
}

export interface ContextRailExpensesOnlyPanelProps
  extends ContextRailExpenseHandlers {
  canEditExpenses: boolean;
  closeLabel: string;
  expenseSummary: ExpenseSummary;
  expenses: Expense[];
  members: Member[];
  title: string;
  onClose: () => void;
}

export interface ContextRailNotesSectionProps extends ContextRailNoteHandlers {
  itemId: ItineraryItem["id"] | undefined;
  notes: StopNote[];
  tripMembers: Trip["members"];
  currentMember: Member;
  canCreateNote: boolean;
  canEdit: boolean;
}

export interface ContextRailExpensesSectionProps
  extends ContextRailExpenseHandlers {
  selectedItemId?: string;
  expenses: Expense[];
  members: Trip["members"];
  perPerson: string;
  groupSpend: string;
  canEditExpenses: boolean;
}

export interface ContextRailBookingSectionProps
  extends ContextRailBookingDocHandlers {
  advisories: NonNullable<ItineraryItem["advisories"]>;
  bookingDocs: BookingDoc[];
  tasks: TripTask[];
  canEdit: boolean;
  onToggleTaskStatus: (taskId: string) => void;
}
