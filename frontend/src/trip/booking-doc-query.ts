import type {
  BookingDoc,
  BookingDocStatus,
  BookingDocType,
  Member,
  Trip,
} from "./types";
import { bookingDocMatchesQuery } from "./booking-doc-search";

export {
  bookingDocLinkedContext,
  bookingDocMatchesQuery,
  compareBookingStartWithUndated,
} from "./booking-doc-search";

export interface BookingDocsSummary {
  totalCostByCurrency: Record<string, number>;
  needsActionCount: number;
  sensitiveDocsTotal: number;
  sensitiveDocsReady: number;
  upcoming: BookingDoc | null;
}

export interface BookingDocFilters {
  query?: string;
  type?: BookingDocType | "all";
  status?: BookingDocStatus | "all";
  travelerId?: string | "all";
  day?: string | "all";
}

const readySensitiveStatuses = new Set<BookingDocStatus>([
  "booked",
  "confirmed",
  "paid",
]);

export function buildBookingDocsSummary(
  docs: BookingDoc[],
  _members: Member[],
  nowIso: string,
): BookingDocsSummary {
  const totalCostByCurrency: Record<string, number> = {};
  let needsActionCount = 0;
  let sensitiveDocsTotal = 0;
  let sensitiveDocsReady = 0;
  const now = Date.parse(nowIso);
  let upcoming: BookingDoc | null = null;
  let upcomingTime = Number.POSITIVE_INFINITY;

  for (const doc of docs) {
    if (typeof doc.priceAmount === "number" && doc.currency) {
      totalCostByCurrency[doc.currency] = roundMoney(
        (totalCostByCurrency[doc.currency] ?? 0) + doc.priceAmount,
      );
    }

    if (doc.status === "needs_action") needsActionCount += 1;

    if (doc.visibility === "sensitive") {
      sensitiveDocsTotal += 1;
      if (readySensitiveStatuses.has(doc.status)) sensitiveDocsReady += 1;
    }

    const startsAt = doc.startsAt ? Date.parse(doc.startsAt) : Number.NaN;
    if (
      Number.isFinite(startsAt) &&
      startsAt >= now &&
      startsAt < upcomingTime &&
      doc.status !== "cancelled"
    ) {
      upcoming = doc;
      upcomingTime = startsAt;
    }
  }

  return {
    totalCostByCurrency,
    needsActionCount,
    sensitiveDocsTotal,
    sensitiveDocsReady,
    upcoming,
  };
}

export function canViewBookingDoc(doc: BookingDoc, member: Member): boolean {
  if (doc.visibility === "shared") return true;
  if (member.role === "owner") return true;

  if (doc.visibility === "private") {
    return doc.ownerMemberId === member.id || doc.createdBy === member.id;
  }

  if (doc.visibility === "sensitive") {
    if (member.role === "organizer") return true;
    return doc.ownerMemberId === member.id || doc.travelerIds.includes(member.id);
  }

  return false;
}

export function filterBookingDocs(
  docs: BookingDoc[],
  filters: BookingDocFilters,
  trip: Trip,
  member: Member,
): BookingDoc[] {
  const query = filters.query?.trim().toLocaleLowerCase() ?? "";
  const type = filters.type ?? "all";
  const status = filters.status ?? "all";
  const travelerId = filters.travelerId ?? "all";
  const day = filters.day ?? "all";
  const itemDayById = new Map(
    trip.itineraryItems.map((item) => [item.id, item.day]),
  );

  return docs.filter((doc) => {
    if (!canViewBookingDoc(doc, member)) return false;
    if (type !== "all" && doc.type !== type) return false;
    if (status !== "all" && doc.status !== status) return false;
    if (travelerId !== "all" && !doc.travelerIds.includes(travelerId)) {
      return false;
    }

    if (day !== "all") {
      const docDay = doc.startsAt?.slice(0, 10);
      const linkedDay = doc.relatedItineraryItemIds.some(
        (itemId) => itemDayById.get(itemId) === day,
      );
      if (docDay !== day && !linkedDay) return false;
    }

    if (!query) return true;
    return bookingDocMatchesQuery(doc, trip, query);
  });
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
