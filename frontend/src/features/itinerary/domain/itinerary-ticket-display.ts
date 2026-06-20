import type { Locale } from "@/src/i18n/types";
import type { BookingDocType, ItineraryItem } from "@/src/trip/types";
import { bookingTitleForItineraryItem } from "@/src/trip/booking-doc-display";
import { readItineraryDetailString } from "../lib/itinerary-item-helpers";

export type TicketModalCopy = {
  cancel: string;
  close: string;
  confirmation: string;
  endsAt: string;
  existingTickets: string;
  linkedActivities: string;
  newTicket: string;
  noExisting: string;
  notes: string;
  provider: string;
  save: string;
  startsAt: string;
  subtitle: string;
  ticketTitle: string;
  title: (activity: string) => string;
  unlink: string;
  unlinking: string;
  useExisting: string;
};

export function bookingTitleForItem(item: ItineraryItem, type: BookingDocType): string {
  return bookingTitleForItineraryItem(item, type);
}

export function ticketNotesForItem(item: ItineraryItem, locale: Locale): string {
  const from = readItineraryDetailString(item.details, "from");
  const to = readItineraryDetailString(item.details, "to") || item.place;
  const parts = [
    locale === "th" ? "จาก itinerary" : "From itinerary",
    from ? `${locale === "th" ? "จาก" : "From"}: ${from}` : null,
    to ? `${locale === "th" ? "ถึง" : "To"}: ${to}` : null,
    item.transportation || null,
  ].filter(Boolean);
  return parts.join("\n");
}

export function ticketModalCopy(locale: Locale): TicketModalCopy {
  if (locale === "th") {
    return {
      cancel: "ยกเลิก",
      close: "ปิด modal ตั๋ว",
      confirmation: "เลข booking / ticket",
      endsAt: "ถึงเวลา",
      existingTickets: "ตั๋วที่มีอยู่",
      linkedActivities: "ใช้ตั๋วนี้กับ activity",
      newTicket: "ตั๋วใหม่",
      noExisting: "ยังไม่มีตั๋วที่เข้ากับ activity นี้",
      notes: "โน้ต",
      provider: "สายการบิน / ผู้ให้บริการ",
      save: "บันทึกตั๋ว",
      startsAt: "ออกเวลา",
      subtitle: "กรอกข้อมูลตั๋ว หรือเลือกตั๋วเดิมเพื่อไม่สร้างซ้ำ",
      ticketTitle: "ชื่อตั๋ว",
      title: (activity) => `ตั๋วสำหรับ ${activity}`,
      unlink: "ยกเลิก link",
      unlinking: "กำลังยกเลิก...",
      useExisting: "ใช้ตั๋วเดิม",
    };
  }

  return {
    cancel: "Cancel",
    close: "Close ticket modal",
    confirmation: "Booking / ticket number",
    endsAt: "Arrives at",
    existingTickets: "Existing tickets",
    linkedActivities: "Use this ticket for activities",
    newTicket: "New ticket",
    noExisting: "No matching tickets yet",
    notes: "Notes",
    provider: "Airline / provider",
    save: "Save ticket",
    startsAt: "Departs at",
    subtitle: "Enter ticket details or reuse an existing ticket to avoid duplicates.",
    ticketTitle: "Ticket title",
    title: (activity) => `Ticket for ${activity}`,
    unlink: "Unlink",
    unlinking: "Unlinking...",
    useExisting: "Use existing",
  };
}
