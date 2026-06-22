import { countMatchingOptions } from "@/src/shared/collection";
import type { BookingDoc, BookingDocStatus, BookingDocType } from "@/src/trip/types";
import type { IconName } from "@/src/ui/icons";

export const bookingFolders = [
  { id: "all", icon: "layout" },
  { id: "needs_action", icon: "warning", status: "needs_action" },
  { id: "transport", icon: "route", types: ["flight", "train", "public_transport"] },
  { id: "stays", icon: "home", types: ["hotel"] },
  { id: "tickets", icon: "ticket", types: ["activity_ticket"] },
  { id: "travel_docs", icon: "document", types: ["passport", "visa", "insurance"] },
  { id: "external_links", icon: "cloud" },
] as const satisfies ReadonlyArray<{
  id: string;
  icon: IconName;
  types?: readonly BookingDocType[];
  status?: BookingDocStatus;
}>;

export type BookingFolderId = (typeof bookingFolders)[number]["id"];
const bookingFolderIds = bookingFolders.map((folder) => folder.id) as BookingFolderId[];

export function countBookingFolders(docs: BookingDoc[]): Record<BookingFolderId, number> {
  return countMatchingOptions(
    bookingFolderIds,
    docs,
    (doc, folderId) => bookingDocMatchesFolder(doc, folderId),
  );
}

export function findBookingFolder(folderId: BookingFolderId) {
  return bookingFolders.find((folder) => folder.id === folderId) ?? bookingFolders[0];
}

export function bookingDocMatchesFolder(doc: BookingDoc, folderId: BookingFolderId): boolean {
  const folder = findBookingFolder(folderId);
  if (folder.id === "all") return true;
  if (folder.id === "external_links") return doc.externalLinks.length > 0;
  if ("status" in folder) return doc.status === folder.status;
  return "types" in folder ? (folder.types as readonly BookingDocType[]).includes(doc.type) : true;
}
