import type {
  BookingDoc,
  Expense,
  ExpenseComment,
  ExpenseLineItem,
  TripPhotoAlbumLink,
} from "./types";

export interface CreateExpenseApiRequest {
  clientMutationId: string;
  tripPlanId?: string | null;
  title: string;
  amountMinor: number;
  currency?: string;
  exchangeRateToSettlementCurrency?: number;
  notes?: string | null;
  receiptUrl?: string | null;
  lineItems?: ExpenseLineItem[];
  comments?: ExpenseComment[];
  paidBy: string;
  category: Expense["category"];
  splits: Record<string, number>;
  itineraryItemId?: string | null;
}

export interface RecordExpenseReminderApiRequest {
  clientMutationId: string;
  from: string;
  to: string;
  amountMinor: number;
}

export interface PatchExpenseApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  tripPlanId?: string | null;
  title?: string;
  amountMinor?: number;
  currency?: string;
  exchangeRateToSettlementCurrency?: number;
  notes?: string | null;
  receiptUrl?: string | null;
  lineItems?: ExpenseLineItem[];
  comments?: ExpenseComment[];
  paidBy?: string;
  category?: Expense["category"];
  splits?: Record<string, number>;
  itineraryItemId?: string | null;
}

export type BookingDocExternalLinkApiRequest = Omit<BookingDoc["externalLinks"][number], "id"> & {
  id?: string;
};

export interface CreateBookingDocApiRequest extends Omit<BookingDoc, "id" | "tripId" | "createdBy" | "updatedAt" | "version" | "externalLinks"> {
  clientMutationId: string;
  externalLinks: BookingDocExternalLinkApiRequest[];
}

export interface PatchBookingDocApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Omit<CreateBookingDocApiRequest, "clientMutationId">>;
}

export interface CreatePhotoAlbumApiRequest extends Omit<TripPhotoAlbumLink, "id" | "tripId" | "createdBy" | "updatedAt" | "version"> {
  clientMutationId: string;
}

export interface PatchPhotoAlbumApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Omit<CreatePhotoAlbumApiRequest, "clientMutationId">>;
}
