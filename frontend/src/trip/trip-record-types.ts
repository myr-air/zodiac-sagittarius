export interface Expense {
  id: string;
  tripId?: string;
  tripPlanId?: string | null;
  title: string;
  amount: number;
  amountMinor?: number;
  currency?: string;
  exchangeRateToSettlementCurrency?: number;
  notes?: string;
  receiptUrl?: string | null;
  lineItems?: ExpenseLineItem[];
  comments?: ExpenseComment[];
  paidBy: string;
  splits: Record<string, number>;
  category: "food" | "transport" | "tickets" | "stay" | "shopping" | "settlement";
  itineraryItemId?: string | null;
  version?: number;
}

export interface ExpenseLineItem {
  id: string;
  title: string;
  amount: number;
  participantIds: string[];
}

export interface ExpenseComment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface ExpenseReminder {
  tripPlanId?: string | null;
  from: string;
  to: string;
  amount: number;
  lastRemindedAt: string;
}

export interface SettlementSuggestion {
  from: string;
  to: string;
  amount: number;
  currency?: string;
  lastRemindedAt?: string | null;
}

export interface ExpenseSummary {
  groupSpend: number;
  settlementCurrency?: string;
  netByMember: Record<string, number>;
  currentUserNetLabel: string;
  settlementSuggestions: SettlementSuggestion[];
}

export type BookingDocType =
  | "flight"
  | "train"
  | "public_transport"
  | "hotel"
  | "insurance"
  | "passport"
  | "visa"
  | "activity_ticket"
  | "other";

export type BookingDocStatus =
  | "draft"
  | "needs_action"
  | "booked"
  | "confirmed"
  | "paid"
  | "cancelled"
  | "expired";

export type BookingDocVisibility = "shared" | "sensitive" | "private";

export interface BookingDocExternalLink {
  id: string;
  label: string;
  url: string;
  provider?: string | null;
  accessNote?: string | null;
}

export interface BookingDoc {
  id: string;
  tripId: string;
  tripPlanId?: string | null;
  type: BookingDocType;
  title: string;
  status: BookingDocStatus;
  visibility: BookingDocVisibility;
  ownerMemberId?: string | null;
  providerName?: string | null;
  confirmationCode?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  priceAmount?: number | null;
  currency?: string | null;
  travelerIds: string[];
  externalLinks: BookingDocExternalLink[];
  relatedItineraryItemIds: string[];
  relatedTaskIds: string[];
  relatedExpenseIds: string[];
  noteIds: string[];
  notes?: string | null;
  createdBy: string;
  updatedAt: string;
  version: number;
}

export type TripPhotoAlbumProvider =
  | "google_photos"
  | "icloud"
  | "google_drive"
  | "dropbox"
  | "onedrive"
  | "custom";

export type TripPhotoAlbumAccess = "view_only" | "collaborative" | "upload_request";

export interface TripPhotoAlbumLink {
  id: string;
  tripId: string;
  title: string;
  provider: TripPhotoAlbumProvider;
  url: string;
  access: TripPhotoAlbumAccess;
  ownerMemberId?: string | null;
  relatedItineraryItemIds: string[];
  day?: string | null;
  description?: string | null;
  accessNote?: string | null;
  coverUrl?: string | null;
  createdBy: string;
  updatedAt: string;
  version: number;
}
