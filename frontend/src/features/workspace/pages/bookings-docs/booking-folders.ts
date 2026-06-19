import type { BookingDoc, BookingDocStatus, BookingDocType } from "@/src/trip/types";
import type { IconName } from "@/src/ui/icons";

export type BookingFolderId = "all" | "needs_action" | "transport" | "stays" | "tickets" | "travel_docs" | "external_links";

export const bookingFolders: Array<{
  id: BookingFolderId;
  icon: IconName;
  types?: BookingDocType[];
  status?: BookingDocStatus;
}> = [
  { id: "all", icon: "layout" },
  { id: "needs_action", icon: "warning", status: "needs_action" },
  { id: "transport", icon: "route", types: ["flight", "train", "public_transport"] },
  { id: "stays", icon: "home", types: ["hotel"] },
  { id: "tickets", icon: "ticket", types: ["activity_ticket"] },
  { id: "travel_docs", icon: "document", types: ["passport", "visa", "insurance"] },
  { id: "external_links", icon: "cloud" },
];

export function countBookingFolders(docs: BookingDoc[]): Record<BookingFolderId, number> {
  return bookingFolders.reduce((counts, folder) => {
    counts[folder.id] = docs.filter((doc) => bookingDocMatchesFolder(doc, folder.id)).length;
    return counts;
  }, {} as Record<BookingFolderId, number>);
}

export function bookingDocMatchesFolder(doc: BookingDoc, folderId: BookingFolderId): boolean {
  const folder = bookingFolders.find((candidate) => candidate.id === folderId);
  if (!folder || folder.id === "all") return true;
  if (folder.id === "external_links") return doc.externalLinks.length > 0;
  if (folder.status) return doc.status === folder.status;
  return folder.types?.includes(doc.type) ?? true;
}
