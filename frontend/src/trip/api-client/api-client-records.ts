import type {
  BookingDoc,
  ExpenseSummary,
  TripPhotoAlbumLink,
} from "../types";
import { tripApiRoutes } from "./api-routes";
import type { TripApiRequester } from "./api-client-transport";
import type { TripApiClient } from "./api-client-types";
import {
  mapExpense,
} from "./api-response-record-mappers";
import type {
  ExpenseResponse,
} from "./api-response-types";

type TripRecordApiClient = Pick<
  TripApiClient,
  | "getExpenseSummary"
  | "recordExpenseReminder"
  | "createExpense"
  | "patchExpense"
  | "deleteExpense"
  | "createBookingDoc"
  | "patchBookingDoc"
  | "deleteBookingDoc"
  | "createPhotoAlbum"
  | "patchPhotoAlbum"
  | "deletePhotoAlbum"
>;

export function createTripRecordApiClient(request: TripApiRequester): TripRecordApiClient {
  return {
    getExpenseSummary(tripId, sessionToken, tripPlanId) {
      return request<ExpenseSummary>(tripApiRoutes.expensesSummary(tripId, tripPlanId), {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    recordExpenseReminder(tripId, sessionToken, reminderRequest, tripPlanId) {
      return request<ExpenseSummary>(tripApiRoutes.expenseReminders(tripId, tripPlanId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(reminderRequest),
      });
    },
    async createExpense(tripId, sessionToken, expenseRequest) {
      const expense = await request<ExpenseResponse>(tripApiRoutes.expenses(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(expenseRequest),
      });
      return mapExpense(expense);
    },
    async patchExpense(tripId, expenseId, sessionToken, expenseRequest) {
      const expense = await request<ExpenseResponse>(tripApiRoutes.expense(tripId, expenseId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(expenseRequest),
      });
      return mapExpense(expense);
    },
    async deleteExpense(tripId, expenseId, sessionToken) {
      const expense = await request<ExpenseResponse>(tripApiRoutes.expense(tripId, expenseId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return mapExpense(expense);
    },
    createBookingDoc(tripId, sessionToken, bookingRequest) {
      return request<BookingDoc>(tripApiRoutes.bookings(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(bookingRequest),
      });
    },
    patchBookingDoc(tripId, bookingId, sessionToken, bookingRequest) {
      return request<BookingDoc>(tripApiRoutes.booking(tripId, bookingId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(bookingRequest),
      });
    },
    deleteBookingDoc(tripId, bookingId, sessionToken) {
      return request<BookingDoc>(tripApiRoutes.booking(tripId, bookingId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    createPhotoAlbum(tripId, sessionToken, albumRequest) {
      return request<TripPhotoAlbumLink>(tripApiRoutes.photoAlbums(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(albumRequest),
      });
    },
    patchPhotoAlbum(tripId, albumId, sessionToken, albumRequest) {
      return request<TripPhotoAlbumLink>(tripApiRoutes.photoAlbum(tripId, albumId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(albumRequest),
      });
    },
    deletePhotoAlbum(tripId, albumId, sessionToken) {
      return request<TripPhotoAlbumLink>(tripApiRoutes.photoAlbum(tripId, albumId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
  };
}
