import { type FormEvent, useMemo, useState } from "react";
import {
  canViewBookingDoc,
  findBookingDocRelations,
} from "@/src/trip/booking-docs";
import type { BookingDoc, BookingDocStatus, BookingDocType, BookingDocVisibility, Member, Trip, TripTask } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "./icons";
import { formatTripRange, PageHeader } from "./PageHeader";
import { Button, IconButton } from "./ui";
import { DateTimePickerField } from "./DateTimePickers";

interface BookingsDocsPageProps {
  trip: Trip;
  tasks: TripTask[];
  currentMember: Member;
  bookingDocs: BookingDoc[];
  canEditBookings: boolean;
  onCreateBookingDoc: (input: BookingDocInput) => void | Promise<void>;
  onUpdateBookingDoc: (bookingDocId: string, input: BookingDocInput) => void | Promise<void>;
  onDeleteBookingDoc: (bookingDocId: string) => void | Promise<void>;
}

export interface BookingDocInput {
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
  externalLinks: BookingDoc["externalLinks"];
  relatedItineraryItemIds: string[];
  relatedTaskIds: string[];
  relatedExpenseIds: string[];
  noteIds: string[];
  notes?: string | null;
}

const bookingTypes = ["flight", "train", "public_transport", "hotel", "insurance", "passport", "visa", "activity_ticket", "other"] satisfies BookingDocType[];
const bookingStatuses = ["draft", "needs_action", "booked", "confirmed", "paid", "cancelled", "expired"] satisfies BookingDocStatus[];
const bookingVisibilities = ["shared", "sensitive", "private"] satisfies BookingDocVisibility[];

type BookingFolderId = "all" | "needs_action" | "transport" | "stays" | "tickets" | "travel_docs" | "external_links";

const bookingFolders: Array<{
  id: BookingFolderId;
  icon: Parameters<typeof Icon>[0]["name"];
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

const pageClassName = "bookings-docs-page grid min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 bg-transparent px-6 py-[22px] pb-7 max-[1199px]:gap-0 max-[1199px]:px-0 max-[1199px]:py-0 max-[1199px]:pb-0 max-[767px]:h-[calc(100dvh-48px)] max-[767px]:min-h-[calc(100dvh-48px)] max-[767px]:grid-rows-[minmax(0,1fr)] max-[767px]:overflow-hidden";
const headerAsideClassName = "booking-docs-header-actions flex min-w-0 items-center justify-end gap-2";
const headerActionRowClassName = "flex min-w-0 flex-wrap items-center justify-end gap-2 max-[1199px]:justify-end";
const mobileAddButtonClassName = "bookings-mobile-add-button !hidden max-[767px]:!fixed max-[767px]:right-[60px] max-[767px]:top-1.5 max-[767px]:z-[45] max-[767px]:!inline-flex max-[767px]:min-h-9 max-[767px]:w-9 max-[767px]:rounded-(--radius-sm) max-[767px]:p-0 max-[767px]:shadow-none";
const contentClassName = "bookings-content grid min-h-0 grid-cols-[192px_minmax(0,1fr)_300px] gap-3 max-[1199px]:grid-cols-1 max-[1199px]:grid-rows-[auto_minmax(0,1fr)] max-[1199px]:gap-0 max-[767px]:h-full max-[767px]:[&_.booking-inspector]:col-span-1";
const folderRailClassName = "booking-folder-rail grid min-h-0 content-start gap-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-2.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:grid-cols-7 max-[1199px]:content-normal max-[1199px]:gap-0 max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-t-0 max-[1199px]:p-0 max-[1199px]:shadow-none";
const folderButtonClassName = "group grid min-h-10 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-(--radius-md) border border-transparent bg-transparent px-2 py-1.5 text-left text-sm font-bold text-(--color-text-muted) transition-[background-color,border-color,color] duration-150 hover:bg-(--color-surface-subtle) hover:text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary) [&_.icon]:size-4 max-[1199px]:min-h-12 max-[1199px]:grid-cols-1 max-[1199px]:grid-rows-[20px_16px] max-[1199px]:justify-items-center max-[1199px]:gap-0 max-[1199px]:rounded-none max-[1199px]:border-0 max-[1199px]:border-b-2 max-[1199px]:border-transparent max-[1199px]:px-0 max-[1199px]:py-1.5 max-[1199px]:text-center max-[767px]:min-h-10 max-[767px]:grid-rows-[18px_12px]";
const selectedFolderClassName = "border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong) max-[1199px]:border-b-(--color-primary) max-[1199px]:bg-transparent";
const filePanelClassName = "bookings-file-panel grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:min-h-[calc(100dvh-180px)] max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-t-0 max-[1199px]:shadow-none max-[767px]:h-full max-[767px]:min-h-0 max-[767px]:border-0";
const fileToolbarClassName = "bookings-file-toolbar grid gap-2 border-b border-(--color-border) p-3 max-[1199px]:px-3 max-[1199px]:py-2 max-[767px]:gap-0 max-[767px]:px-2 max-[767px]:py-2";
const toolbarControlsClassName = "grid grid-cols-[minmax(0,1fr)_176px] items-center gap-2 max-[767px]:grid-cols-[minmax(0,1fr)_132px] max-[767px]:gap-1.5";
const searchInputClassName = "min-h-10 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) px-3 text-sm font-medium text-(--color-text) outline-none transition-colors placeholder:text-(--color-text-subtle) focus:border-(--color-primary) focus:bg-(--color-surface) max-[767px]:min-h-9";
const statusFilterWrapClassName = "status-filter relative min-w-0";
const statusFilterButtonClassName = "status-filter-button grid min-h-10 w-full grid-cols-[minmax(0,1fr)_16px] items-center gap-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-2.5 text-left text-xs font-extrabold text-(--color-text) transition-[background,border-color,color] duration-150 hover:border-(--color-primary-border) hover:bg-(--color-surface-subtle) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary) aria-[expanded=true]:border-(--color-primary-border) aria-[expanded=true]:bg-(--color-primary-soft) max-[767px]:min-h-9 max-[767px]:px-2";
const statusFilterMenuClassName = "status-filter-menu absolute right-0 top-[calc(100%+6px)] z-40 grid w-[220px] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-1 shadow-[0_10px_18px_rgb(15_23_42_/_0.14)] max-[767px]:right-0 max-[767px]:w-[min(220px,calc(100vw-16px))]";
const statusFilterOptionClassName = "status-filter-option grid min-h-9 w-full grid-cols-[16px_minmax(0,1fr)] items-center gap-2 rounded-(--radius-sm) border-0 bg-transparent px-2 text-left text-xs font-bold text-(--color-text-muted) hover:bg-(--color-surface-subtle) hover:text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--color-primary)";
const statusFilterOptionActiveClassName = "bg-(--color-primary-soft) text-(--color-primary-strong)";
const activeFolderBarClassName = "flex flex-wrap items-center justify-between gap-2 border-b border-(--color-border) px-3 py-2 max-[767px]:px-3 max-[767px]:py-2";
const activeFolderDescriptionClassName = "text-xs font-semibold text-(--color-text-muted) max-[767px]:hidden";
const fieldClassName = "grid min-w-0 gap-1.5 [&>span]:text-[11px] [&>span]:font-extrabold [&>span]:text-(--color-text-muted) [&_input]:min-h-10 [&_input]:rounded-(--radius-md) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-3 [&_input]:text-sm [&_select]:min-h-10 [&_select]:rounded-(--radius-md) [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface) [&_select]:px-3 [&_select]:text-sm [&_textarea]:min-h-[74px] [&_textarea]:resize-y [&_textarea]:rounded-(--radius-md) [&_textarea]:border [&_textarea]:border-(--color-border) [&_textarea]:bg-(--color-surface) [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm";
const fileListClassName = "booking-file-list min-h-0 overflow-auto";
const fileHeaderClassName = "sticky top-0 z-[1] grid min-w-[760px] grid-cols-[minmax(220px,1.7fr)_90px_100px_minmax(120px,1fr)_108px_70px] items-center gap-2 border-b border-(--color-border) bg-(--color-surface-subtle) px-3 py-2 text-[11px] font-black text-(--color-text-muted) max-[1199px]:hidden";
const fileRowClassName = "booking-file-row grid min-w-[760px] grid-cols-[minmax(220px,1.7fr)_90px_100px_minmax(120px,1fr)_108px_70px] items-center gap-2 border-b border-(--color-border) px-3 py-2.5 text-left text-sm transition-colors hover:bg-(--color-surface-subtle) focus-within:bg-(--color-primary-soft) max-[1199px]:min-w-0 max-[1199px]:grid-cols-[minmax(0,1fr)_auto] max-[1199px]:gap-x-3 max-[1199px]:gap-y-1 max-[1199px]:px-3 max-[1199px]:py-3";
const selectedFileRowClassName = "bg-(--color-primary-soft)";
const lockedRowClassName = "booking-row-locked grid min-h-[46px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-(--color-border) px-3 py-2 text-sm";
const badgeClassName = "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-extrabold capitalize";
const inspectorClassName = "booking-inspector sticky top-3 grid max-h-[calc(100vh-92px)] content-start gap-3 overflow-auto rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:!fixed max-[1199px]:bottom-0 max-[1199px]:left-[74px] max-[1199px]:right-0 max-[1199px]:top-auto max-[1199px]:z-30 max-[1199px]:!max-h-[72vh] max-[1199px]:rounded-b-none max-[1199px]:rounded-t-(--radius-lg) max-[1199px]:border-x-0 max-[1199px]:border-b-0 max-[1199px]:p-3 max-[1199px]:pb-[calc(12px+env(safe-area-inset-bottom))] max-[1199px]:shadow-[0_-8px_16px_rgb(15_23_42_/_0.14)] max-[1199px]:transition-[transform,opacity] max-[1199px]:duration-200 max-[1199px]:ease-out max-[767px]:left-0 motion-reduce:max-[1199px]:transition-none";
const mobileInspectorOpenClassName = "max-[1199px]:translate-y-0 max-[1199px]:opacity-100 max-[1199px]:pointer-events-auto";
const mobileInspectorClosedClassName = "max-[1199px]:translate-y-full max-[1199px]:opacity-0 max-[1199px]:pointer-events-none";
const inspectorSectionClassName = "grid gap-2 border-t border-(--color-border) pt-3 text-sm";
const dialogBackdropClassName = "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-4";
const dialogClassName = "booking-dialog grid max-h-[min(760px,calc(100vh_-_32px))] w-full max-w-[760px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]";
const dialogHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-(--color-border) px-4 py-3 [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-extrabold";
const dialogFormClassName = "grid min-h-0 gap-3 overflow-y-auto p-4";
const dialogGridClassName = "grid grid-cols-2 gap-3 max-[767px]:grid-cols-1";
const dialogActionsClassName = "flex flex-wrap items-center justify-end gap-2 border-t border-(--color-border) pt-3";
const deleteDialogClassName = "delete-confirm-dialog grid w-[min(420px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-danger-border) bg-(--color-surface) p-4 shadow-[0_14px_34px_rgb(15_23_42_/_0.14)]";
const bookingCopy = {
  en: {
    pageLabel: "Bookings & Docs",
    title: "Bookings & Docs",
    records: (count: number) => `${count} records`,
    canEditBookings: "Can edit bookings",
    readOnly: "Read-only",
    bookingFolders: "Booking folders",
    folderCount: (title: string, count: number) => `${title}, ${count} items`,
    visibleItems: (description: string, count: number) => `${description} · ${count} visible items`,
    addBooking: "Add booking",
    searchPlaceholder: "Search bookings, docs, links",
    statusFilter: "Status",
    allStatuses: "All statuses",
    fileList: "Files",
    columnName: "Name",
    columnDate: "Date",
    columnProvider: "Provider",
    columnLinkedStop: "Linked stop",
    columnStatus: "Status",
    columnOpen: "Open",
    itemCount: (count: number) => `${count} items`,
    emptyTitle: "No matching files",
    emptyDetail: "Try another folder, status, or search term.",
    lockedSensitiveRecord: "Locked sensitive record",
    select: (title: string) => `Select ${title}`,
    noProvider: "No provider",
    noLinkedStop: "No linked stop",
    noDate: "No date",
    noConfirmation: "No confirmation",
    confirmation: "Confirmation",
    quickFacts: "Quick facts",
    travelers: (count: number) => `${count} travelers`,
    noPrice: "No price",
    links: (count: number) => `${count} links`,
    cloudLink: "Cloud link",
    open: "Open",
    noLink: "No link",
    editBooking: "Edit booking",
    deleteBooking: "Delete booking",
    bookingDetails: "Booking details",
    closeBookingPreview: "Close booking preview",
    noBookingSelected: "No booking selected",
    noNotes: "No notes yet.",
    externalLinks: "External links",
    openLink: (label: string) => `Open ${label}`,
    noExternalLinks: "No external links yet.",
    tripContext: "Trip context",
    itineraryLinks: (count: number) => `${count} itinerary links`,
    todos: (count: number) => `${count} todos`,
    expenses: (count: number) => `${count} expenses`,
    notes: (count: number) => `${count} notes`,
    noTravelers: "No travelers",
    addBookingDialog: "Add booking",
    editBookingDialog: "Edit booking",
    closeBookingDialog: "Close booking dialog",
    titleField: "Title",
    typeField: "Type",
    statusField: "Status",
    visibilityField: "Visibility",
    providerField: "Provider",
    confirmationCodeField: "Confirmation code",
    startField: "Start",
    endField: "End",
    priceField: "Price",
    currencyField: "Currency",
    externalLinkField: "External link",
    notesField: "Notes",
    travelersField: "Travelers",
    linkedItinerary: "Linked itinerary",
    linkedTodos: "Linked todos",
    linkedExpenses: "Linked expenses",
    linkedNotes: "Linked notes",
    cancel: "Cancel",
    saveBooking: "Save booking",
    deletePrompt: (title: string) => `Delete ${title}? Related itinerary, todo, and expense records will stay in place.`,
    anyTimeDocs: "Any time docs",
    externalLinkLabel: "External link",
    folders: {
      all: { title: "All items", description: "Everything saved for this trip" },
      transport: { title: "Transport", description: "Flights, trains, local passes" },
      stays: { title: "Stays", description: "Hotels and room bookings" },
      tickets: { title: "Tickets", description: "Attractions and activities" },
      travel_docs: { title: "Travel docs", description: "Passport, visa, insurance" },
      needs_action: { title: "Needs action", description: "Missing, unpaid, or pending" },
      external_links: { title: "Links & files", description: "Drive, photos, cloud storage" },
    },
    enumLabels: {
      flight: "Flight",
      train: "Train",
      public_transport: "Public Transport",
      hotel: "Hotel",
      insurance: "Insurance",
      passport: "Passport",
      visa: "Visa",
      activity_ticket: "Activity Ticket",
      other: "Other",
      draft: "Draft",
      needs_action: "Needs Action",
      booked: "Booked",
      confirmed: "Confirmed",
      paid: "Paid",
      cancelled: "Cancelled",
      expired: "Expired",
      shared: "Shared",
      sensitive: "Sensitive",
      private: "Private",
    },
  },
  th: {
    pageLabel: "การจองและเอกสาร",
    title: "การจองและเอกสาร",
    records: (count: number) => `${count} รายการ`,
    canEditBookings: "แก้ไขการจองได้",
    readOnly: "อ่านอย่างเดียว",
    bookingFolders: "โฟลเดอร์การจอง",
    folderCount: (title: string, count: number) => `${title}, ${count} รายการ`,
    visibleItems: (description: string, count: number) => `${description} · แสดง ${count} รายการ`,
    addBooking: "เพิ่มการจอง",
    searchPlaceholder: "ค้นหาการจอง เอกสาร ลิงก์",
    statusFilter: "สถานะ",
    allStatuses: "ทุกสถานะ",
    fileList: "ไฟล์",
    columnName: "ชื่อ",
    columnDate: "วันที่",
    columnProvider: "ผู้ให้บริการ",
    columnLinkedStop: "จุดที่เกี่ยวข้อง",
    columnStatus: "สถานะ",
    columnOpen: "เปิด",
    itemCount: (count: number) => `${count} รายการ`,
    emptyTitle: "ไม่พบไฟล์ที่ตรงกัน",
    emptyDetail: "ลองเปลี่ยนโฟลเดอร์ สถานะ หรือคำค้นหา",
    lockedSensitiveRecord: "รายการละเอียดอ่อนถูกล็อก",
    select: (title: string) => `เลือก ${title}`,
    noProvider: "ยังไม่มีผู้ให้บริการ",
    noLinkedStop: "ยังไม่ได้ผูกจุดแวะ",
    noDate: "ยังไม่มีวันที่",
    noConfirmation: "ยังไม่มีรหัสยืนยัน",
    confirmation: "รหัสยืนยัน",
    quickFacts: "ข้อมูลสำคัญ",
    travelers: (count: number) => `${count} ผู้เดินทาง`,
    noPrice: "ยังไม่มีราคา",
    links: (count: number) => `${count} ลิงก์`,
    cloudLink: "ลิงก์คลาวด์",
    open: "เปิด",
    noLink: "ยังไม่มีลิงก์",
    editBooking: "แก้ไขการจอง",
    deleteBooking: "ลบการจอง",
    bookingDetails: "รายละเอียดการจอง",
    closeBookingPreview: "ปิดตัวอย่างการจอง",
    noBookingSelected: "ยังไม่ได้เลือกการจอง",
    noNotes: "ยังไม่มีโน้ต",
    externalLinks: "ลิงก์ภายนอก",
    openLink: (label: string) => `เปิด ${label}`,
    noExternalLinks: "ยังไม่มีลิงก์ภายนอก",
    tripContext: "บริบทของทริป",
    itineraryLinks: (count: number) => `${count} ลิงก์แผนเดินทาง`,
    todos: (count: number) => `${count} งาน`,
    expenses: (count: number) => `${count} ค่าใช้จ่าย`,
    notes: (count: number) => `${count} โน้ต`,
    noTravelers: "ยังไม่มีผู้เดินทาง",
    addBookingDialog: "เพิ่มการจอง",
    editBookingDialog: "แก้ไขการจอง",
    closeBookingDialog: "ปิดหน้าต่างการจอง",
    titleField: "ชื่อ",
    typeField: "ประเภท",
    statusField: "สถานะ",
    visibilityField: "การมองเห็น",
    providerField: "ผู้ให้บริการ",
    confirmationCodeField: "รหัสยืนยัน",
    startField: "เริ่ม",
    endField: "สิ้นสุด",
    priceField: "ราคา",
    currencyField: "สกุลเงิน",
    externalLinkField: "ลิงก์ภายนอก",
    notesField: "โน้ต",
    travelersField: "ผู้เดินทาง",
    linkedItinerary: "แผนเดินทางที่เกี่ยวข้อง",
    linkedTodos: "งานที่เกี่ยวข้อง",
    linkedExpenses: "ค่าใช้จ่ายที่เกี่ยวข้อง",
    linkedNotes: "โน้ตที่เกี่ยวข้อง",
    cancel: "ยกเลิก",
    saveBooking: "บันทึกการจอง",
    deletePrompt: (title: string) => `ลบ ${title}? แผนเดินทาง งาน และค่าใช้จ่ายที่เกี่ยวข้องจะยังอยู่`,
    anyTimeDocs: "เอกสารไม่ระบุเวลา",
    externalLinkLabel: "ลิงก์ภายนอก",
    folders: {
      all: { title: "ทุกอย่าง", description: "ทุกอย่างที่บันทึกไว้สำหรับทริปนี้" },
      transport: { title: "การเดินทาง", description: "เที่ยวบิน รถไฟ และพาสในเมือง" },
      stays: { title: "ที่พัก", description: "โรงแรมและการจองห้องพัก" },
      tickets: { title: "ตั๋ว", description: "สถานที่ท่องเที่ยวและกิจกรรม" },
      travel_docs: { title: "เอกสารเดินทาง", description: "พาสปอร์ต วีซ่า และประกัน" },
      needs_action: { title: "ต้องดำเนินการ", description: "ขาดข้อมูล ยังไม่จ่าย หรือรอดำเนินการ" },
      external_links: { title: "ลิงก์และไฟล์", description: "Drive รูปภาพ และคลาวด์" },
    },
    enumLabels: {
      flight: "เที่ยวบิน",
      train: "รถไฟ",
      public_transport: "ขนส่งสาธารณะ",
      hotel: "โรงแรม",
      insurance: "ประกัน",
      passport: "พาสปอร์ต",
      visa: "วีซ่า",
      activity_ticket: "ตั๋วกิจกรรม",
      other: "อื่นๆ",
      draft: "ร่าง",
      needs_action: "ต้องดำเนินการ",
      booked: "จองแล้ว",
      confirmed: "ยืนยันแล้ว",
      paid: "จ่ายแล้ว",
      cancelled: "ยกเลิกแล้ว",
      expired: "หมดอายุ",
      shared: "แชร์",
      sensitive: "ละเอียดอ่อน",
      private: "ส่วนตัว",
    },
  },
} as const;

export function BookingsDocsPage({
  trip,
  tasks,
  currentMember,
  bookingDocs,
  canEditBookings,
  onCreateBookingDoc,
  onUpdateBookingDoc,
  onDeleteBookingDoc,
}: BookingsDocsPageProps) {
  const { locale } = useI18n();
  const copy = bookingCopy[locale];
  const [activeFolderId, setActiveFolderId] = useState<BookingFolderId>("all");
  const [selectedBookingId, setSelectedBookingId] = useState(bookingDocs[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingDocStatus | "all">("all");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [dialogBooking, setDialogBooking] = useState<BookingDoc | "new" | null>(null);
  const [deleteBooking, setDeleteBooking] = useState<BookingDoc | null>(null);
  const visibleDocs = useMemo(() => bookingDocs.filter((doc) => canViewBookingDoc(doc, currentMember)), [bookingDocs, currentMember]);
  const folderDocs = useMemo(() => visibleDocs
    .filter((doc) => bookingDocMatchesFolder(doc, activeFolderId))
    .filter((doc) => statusFilter === "all" || doc.status === statusFilter)
    .filter((doc) => bookingDocMatchesQuery(doc, trip, query))
    .sort(compareBookingStartWithUndated), [activeFolderId, query, statusFilter, trip, visibleDocs]);
  const folderCounts = useMemo(() => countBookingFolders(visibleDocs), [visibleDocs]);
  const lockedDocs = bookingDocs.filter((doc) => !canViewBookingDoc(doc, currentMember));
  const selectedBooking = folderDocs.find((doc) => doc.id === selectedBookingId) ?? folderDocs[0] ?? null;
  const selectedRelations = selectedBooking ? findBookingDocRelations(selectedBooking, trip, tasks) : null;
  const activeFolder = bookingFolders.find((folder) => folder.id === activeFolderId) ?? bookingFolders[0];
  const activeFolderCopy = copy.folders[activeFolder.id];

  async function submitBooking(input: BookingDocInput) {
    if (dialogBooking === "new") {
      await onCreateBookingDoc(input);
    } else if (dialogBooking) {
      await onUpdateBookingDoc(dialogBooking.id, input);
    }
    setDialogBooking(null);
  }

  async function confirmDelete() {
    if (!deleteBooking) return;
    await onDeleteBookingDoc(deleteBooking.id);
    setDeleteBooking(null);
  }

  function selectBooking(bookingDocId: string) {
    setSelectedBookingId(bookingDocId);
    setMobilePreviewOpen(true);
  }

  return (
    <section className={pageClassName} aria-label={copy.pageLabel} role="region">
      <BookingsDocsHeader
        canEditBookings={canEditBookings}
        copy={copy}
        locale={locale}
        onAddBooking={() => setDialogBooking("new")}
        recordCount={bookingDocs.length}
        trip={trip}
      />
      {canEditBookings ? (
        <Button className={mobileAddButtonClassName} type="button" onClick={() => setDialogBooking("new")} aria-label={copy.addBooking} title={copy.addBooking}>
          <Icon name="plus" />
        </Button>
      ) : null}

      <div className={contentClassName}>
        <nav className={folderRailClassName} aria-label={copy.bookingFolders}>
          {bookingFolders.map((folder) => (
            <button
              type="button"
              className={cn(folderButtonClassName, activeFolderId === folder.id && selectedFolderClassName)}
              key={folder.id}
              onClick={() => {
                setActiveFolderId(folder.id);
                setMobilePreviewOpen(false);
                setStatusMenuOpen(false);
              }}
              aria-pressed={activeFolderId === folder.id}
              aria-label={copy.folderCount(copy.folders[folder.id].title, folderCounts[folder.id] ?? 0)}
            >
              <span className="grid size-7 place-items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) text-(--color-primary-strong) max-[1199px]:size-5 max-[1199px]:border-0 max-[1199px]:bg-transparent">
                <Icon name={folder.icon} />
              </span>
              <span className="min-w-0 max-[767px]:hidden">
                <strong className="block truncate text-sm font-extrabold max-[1199px]:text-[11px] max-[1199px]:leading-4">{copy.folders[folder.id].title}</strong>
                <span className="block truncate text-[11px] font-semibold text-(--color-text-muted) max-[1199px]:hidden">{copy.folders[folder.id].description}</span>
              </span>
              <strong className="tabular-nums text-xs text-(--color-text-muted) max-[1199px]:text-[11px]">{folderCounts[folder.id] ?? 0}</strong>
            </button>
          ))}
        </nav>

        <section className={filePanelClassName} aria-label={copy.fileList}>
          <div className={fileToolbarClassName}>
            <div className={toolbarControlsClassName}>
              <label className="min-w-0">
                <span className="sr-only">{copy.searchPlaceholder}</span>
                <input
                  className={searchInputClassName}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setMobilePreviewOpen(false);
                    setStatusMenuOpen(false);
                  }}
                  placeholder={copy.searchPlaceholder}
                  type="search"
                />
              </label>
              <div className={statusFilterWrapClassName}>
                <button
                  aria-controls="booking-status-filter-menu"
                  aria-expanded={statusMenuOpen}
                  aria-haspopup="listbox"
                  aria-label={`${copy.statusFilter}: ${statusFilter === "all" ? copy.allStatuses : formatEnumLabel(statusFilter, copy)}`}
                  className={statusFilterButtonClassName}
                  onClick={() => setStatusMenuOpen((current) => !current)}
                  type="button"
                >
                  <span className="truncate">{statusFilter === "all" ? copy.allStatuses : formatEnumLabel(statusFilter, copy)}</span>
                  <Icon name="chevronRight" className={cn("size-3.5 transition-transform", statusMenuOpen && "rotate-90")} />
                </button>
                {statusMenuOpen ? (
                  <div className={statusFilterMenuClassName} id="booking-status-filter-menu" role="listbox" aria-label={copy.statusFilter}>
                    {(["all", ...bookingStatuses] as Array<BookingDocStatus | "all">).map((status) => {
                      const selected = statusFilter === status;
                      return (
                        <button
                          aria-selected={selected}
                          className={cn(statusFilterOptionClassName, selected && statusFilterOptionActiveClassName)}
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);
                            setStatusMenuOpen(false);
                            setMobilePreviewOpen(false);
                          }}
                          role="option"
                          type="button"
                        >
                          <span>{selected ? <Icon name="check" className="size-3.5" /> : null}</span>
                          <span className="truncate">{status === "all" ? copy.allStatuses : formatEnumLabel(status, copy)}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className={activeFolderBarClassName}>
            <div className="grid gap-0.5">
              <strong className="text-[15px] font-extrabold text-(--color-text)">{activeFolderCopy.title}</strong>
              <span className={activeFolderDescriptionClassName}>{copy.visibleItems(activeFolderCopy.description, folderDocs.length)}</span>
            </div>
            <span className="text-xs font-black text-(--color-text-muted)">{copy.itemCount(folderDocs.length)}</span>
          </div>

          <div className={fileListClassName}>
            <div className={fileHeaderClassName} aria-hidden="true">
              <span>{copy.columnName}</span>
              <span>{copy.columnDate}</span>
              <span>{copy.columnProvider}</span>
              <span>{copy.columnLinkedStop}</span>
              <span>{copy.columnStatus}</span>
              <span>{copy.columnOpen}</span>
            </div>
            {folderDocs.map((doc) => (
              <BookingFileRow
                key={doc.id}
                doc={doc}
                trip={trip}
                selected={selectedBooking?.id === doc.id}
                canEdit={canEditBookings}
                onSelect={() => selectBooking(doc.id)}
                onEdit={() => setDialogBooking(doc)}
                onDelete={() => setDeleteBooking(doc)}
                copy={copy}
              />
            ))}
            {!folderDocs.length ? (
              <div className="grid min-h-[180px] min-w-[720px] place-items-center p-5 text-center max-[1199px]:min-w-0 max-[1199px]:w-full max-[767px]:min-h-[220px] max-[767px]:px-4">
                <div className="grid max-w-[360px] gap-1">
                  <strong className="text-(--color-text)">{copy.emptyTitle}</strong>
                  <span className="text-sm font-medium leading-6 text-(--color-text-muted)">{copy.emptyDetail}</span>
                </div>
              </div>
            ) : null}
            {lockedDocs.map((doc) => (
              <div className={lockedRowClassName} key={doc.id}>
                <span className="inline-flex items-center gap-2 font-extrabold text-(--color-text-muted)"><Icon name="eyeOff" /> {copy.lockedSensitiveRecord}</span>
                <span className="text-xs font-bold text-(--color-text-muted)">{formatEnumLabel(doc.type, copy)}</span>
              </div>
            ))}
          </div>
        </section>

        <BookingInspector
          booking={selectedBooking}
          canEdit={canEditBookings}
          copy={copy}
          mobileOpen={mobilePreviewOpen && Boolean(selectedBooking)}
          onClose={() => setMobilePreviewOpen(false)}
          onDelete={() => selectedBooking && setDeleteBooking(selectedBooking)}
          onEdit={() => selectedBooking && setDialogBooking(selectedBooking)}
          relations={selectedRelations}
        />
      </div>

      {dialogBooking ? (
        <BookingDialog
          booking={dialogBooking === "new" ? null : dialogBooking}
          trip={trip}
          tasks={tasks}
          onCancel={() => setDialogBooking(null)}
          onSubmit={submitBooking}
          copy={copy}
        />
      ) : null}

      {deleteBooking ? (
        <div className={dialogBackdropClassName} role="presentation">
          <section className={deleteDialogClassName} role="dialog" aria-modal="true" aria-labelledby="booking-delete-title">
            <h2 id="booking-delete-title" className="m-0 text-base font-extrabold text-(--color-danger)">{copy.deleteBooking}</h2>
            <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">{copy.deletePrompt(deleteBooking.title)}</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteBooking(null)}>{copy.cancel}</Button>
              <Button type="button" variant="danger" onClick={confirmDelete}>{copy.deleteBooking}</Button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function BookingsDocsHeader({
  canEditBookings,
  copy,
  locale,
  onAddBooking,
  recordCount,
  trip,
}: {
  canEditBookings: boolean;
  copy: typeof bookingCopy.en | typeof bookingCopy.th;
  locale: Locale;
  onAddBooking: () => void;
  recordCount: number;
  trip: Trip;
}) {
  return (
    <PageHeader
      title={copy.title}
      subtitle={trip.name}
      meta={(
        <>
          <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
          <span><Icon name="ticket" /> {copy.records(recordCount)}</span>
        </>
      )}
      aside={canEditBookings ? (
        <div className={headerAsideClassName}>
          <div className={headerActionRowClassName}>
            <Button type="button" onClick={onAddBooking} aria-label={copy.addBooking}>
              <Icon name="plus" /> <span>{copy.addBooking}</span>
            </Button>
          </div>
        </div>
      ) : null}
    />
  );
}

function BookingFileRow({ doc, copy, trip, selected, canEdit, onSelect, onEdit, onDelete }: {
  doc: BookingDoc;
  copy: typeof bookingCopy.en | typeof bookingCopy.th;
  trip: Trip;
  selected: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const linkedStop = bookingDocLinkedContext(doc, trip) || copy.noLinkedStop;
  const provider = doc.providerName ?? copy.noProvider;

  return (
    <article className={cn(fileRowClassName, selected && selectedFileRowClassName)}>
      <button type="button" className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2 text-left max-[1199px]:col-start-1 max-[1199px]:row-start-1" onClick={onSelect} aria-label={copy.select(doc.title)}>
        <span className={cn("grid size-8 place-items-center rounded-(--radius-sm) border", typeIconClassName(doc.type))}>
          <Icon name={bookingTypeIcon(doc.type)} />
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm font-black text-(--color-text)">{doc.title}</strong>
          <span className="block truncate text-[11px] font-bold text-(--color-text-muted)">
            {formatEnumLabel(doc.type, copy)}{doc.confirmationCode ? ` · ${copy.confirmation}: ${doc.confirmationCode}` : ""}
          </span>
        </span>
      </button>
      <span className="truncate text-xs font-bold tabular-nums text-(--color-text-muted) max-[1199px]:col-start-1 max-[1199px]:row-start-2 max-[1199px]:pl-[42px]">{doc.startsAt ? formatDateTime(doc.startsAt) : copy.noDate}</span>
      <span className="truncate text-xs font-bold text-(--color-text-muted) max-[1199px]:col-start-1 max-[1199px]:row-start-3 max-[1199px]:pl-[42px]">{provider}</span>
      <span className="truncate text-xs font-bold text-(--color-text-muted) max-[1199px]:hidden">{linkedStop}</span>
      <span className={cn(badgeClassName, statusBadgeClassName(doc.status), "max-[1199px]:col-start-2 max-[1199px]:row-start-1 max-[1199px]:justify-self-end")}>{formatEnumLabel(doc.status, copy)}</span>
      <span className="inline-flex justify-end gap-1 max-[1199px]:hidden">
        {doc.externalLinks[0] ? (
          <a className="grid size-8 place-items-center rounded-(--radius-sm) text-(--color-primary-strong) hover:bg-(--color-primary-soft)" href={doc.externalLinks[0].url} target="_blank" rel="noreferrer" aria-label={copy.openLink(doc.externalLinks[0].label)}>
            <Icon name="external" />
          </a>
        ) : <span className="grid size-8 place-items-center text-(--color-text-muted)" title={copy.noLink}>-</span>}
        {canEdit ? (
          <>
            <IconButton type="button" aria-label={copy.editBooking} onClick={onEdit}><Icon name="edit" /></IconButton>
            <IconButton type="button" aria-label={copy.deleteBooking} onClick={onDelete}><Icon name="trash" /></IconButton>
          </>
        ) : null}
      </span>
    </article>
  );
}

function BookingInspector({
  booking,
  canEdit,
  copy,
  mobileOpen,
  onClose,
  onDelete,
  onEdit,
  relations,
}: {
  booking: BookingDoc | null;
  canEdit: boolean;
  copy: typeof bookingCopy.en | typeof bookingCopy.th;
  mobileOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  relations: ReturnType<typeof findBookingDocRelations> | null;
}) {
  if (!booking || !relations) {
    return (
      <section className={cn(inspectorClassName, mobileInspectorClosedClassName)} aria-label={copy.bookingDetails}>
        <strong className="text-(--color-text)">{copy.noBookingSelected}</strong>
      </section>
    );
  }

  return (
    <section
      className={cn(inspectorClassName, mobileOpen ? mobileInspectorOpenClassName : mobileInspectorClosedClassName)}
      aria-label={copy.bookingDetails}
    >
      <div className="hidden max-[767px]:grid max-[767px]:grid-cols-[minmax(0,1fr)_auto] max-[767px]:items-center max-[767px]:gap-2">
        <span className="mx-auto h-1 w-10 rounded-full bg-(--color-border-strong)" aria-hidden="true" />
        <IconButton type="button" aria-label={copy.closeBookingPreview} onClick={onClose}><Icon name="x" /></IconButton>
      </div>
      <div className="grid gap-1">
        <span className={cn(badgeClassName, statusBadgeClassName(booking.status))}>{formatEnumLabel(booking.status, copy)}</span>
        <h2 className="m-0 text-lg font-extrabold text-(--color-text)">{booking.title}</h2>
        <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">{booking.notes ?? copy.noNotes}</p>
        {canEdit ? (
          <div className="mt-1 flex gap-1.5">
            <Button type="button" variant="secondary" onClick={onEdit}><Icon name="edit" /> {copy.editBooking}</Button>
            <IconButton type="button" aria-label={copy.deleteBooking} onClick={onDelete}><Icon name="trash" /></IconButton>
          </div>
        ) : null}
      </div>

      <div className={inspectorSectionClassName}>
        <strong>{copy.quickFacts}</strong>
        <span>{formatEnumLabel(booking.type, copy)}</span>
        <span>{booking.startsAt ? formatDateTime(booking.startsAt) : copy.noDate}</span>
        <span>{booking.providerName ?? copy.noProvider}</span>
        <span>{booking.confirmationCode ? `${copy.confirmation}: ${booking.confirmationCode}` : copy.noConfirmation}</span>
      </div>

      <div className={inspectorSectionClassName}>
        <strong>{copy.externalLinks}</strong>
        {booking.externalLinks.length ? booking.externalLinks.map((link) => (
          <a className="inline-flex min-h-9 items-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-extrabold text-(--color-primary-strong)" href={link.url} key={link.id} target="_blank" rel="noreferrer">
            <Icon name="external" /> {copy.openLink(link.label)}
          </a>
        )) : <span className="text-sm text-(--color-text-muted)">{copy.noExternalLinks}</span>}
      </div>

      <div className={inspectorSectionClassName}>
        <strong>{copy.tripContext}</strong>
        <span>{copy.itineraryLinks(relations.itineraryItems.length)}</span>
        <span>{copy.todos(relations.tasks.length)}</span>
        <span>{copy.expenses(relations.expenses.length)}</span>
        <span>{copy.notes(relations.notes.length)}</span>
        <span>{relations.travelers.map((member) => member.displayName).join(", ") || copy.noTravelers}</span>
      </div>
    </section>
  );
}

function BookingDialog({ booking, copy, trip, tasks, onCancel, onSubmit }: {
  booking: BookingDoc | null;
  copy: typeof bookingCopy.en | typeof bookingCopy.th;
  trip: Trip;
  tasks: TripTask[];
  onCancel: () => void;
  onSubmit: (input: BookingDocInput) => void | Promise<void>;
}) {
  const [title, setTitle] = useState(booking?.title ?? "");
  const [type, setType] = useState<BookingDocType>(booking?.type ?? "flight");
  const [status, setStatus] = useState<BookingDocStatus>(booking?.status ?? "draft");
  const [visibility, setVisibility] = useState<BookingDocVisibility>(booking?.visibility ?? "shared");
  const [providerName, setProviderName] = useState(booking?.providerName ?? "");
  const [confirmationCode, setConfirmationCode] = useState(booking?.confirmationCode ?? "");
  const [startsAt, setStartsAt] = useState(toDateTimeLocalValue(booking?.startsAt));
  const [endsAt, setEndsAt] = useState(toDateTimeLocalValue(booking?.endsAt));
  const [priceAmount, setPriceAmount] = useState(booking?.priceAmount?.toString() ?? "");
  const [currency, setCurrency] = useState(booking?.currency ?? "HKD");
  const [externalUrl, setExternalUrl] = useState(booking?.externalLinks[0]?.url ?? "");
  const [notes, setNotes] = useState(booking?.notes ?? "");
  const [travelerIds, setTravelerIds] = useState(() => booking?.travelerIds ?? trip.members.slice(0, 1).map((member) => member.id));
  const [relatedItineraryItemIds, setRelatedItineraryItemIds] = useState(() => booking?.relatedItineraryItemIds ?? []);
  const [relatedTaskIds, setRelatedTaskIds] = useState(() => booking?.relatedTaskIds ?? []);
  const [relatedExpenseIds, setRelatedExpenseIds] = useState(() => booking?.relatedExpenseIds ?? []);
  const [noteIds, setNoteIds] = useState(() => booking?.noteIds ?? []);
  const stopNotes = trip.stopNotes ?? [];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const linkUrl = externalUrl.trim();

    onSubmit({
      type,
      title: trimmedTitle,
      status,
      visibility,
      ownerMemberId: visibility === "private" ? travelerIds[0] || null : booking?.ownerMemberId ?? null,
      providerName: providerName.trim() || null,
      confirmationCode: confirmationCode.trim() || null,
      startsAt: fromDateTimeLocalValue(startsAt),
      endsAt: fromDateTimeLocalValue(endsAt),
      timezone: booking?.timezone ?? "Asia/Hong_Kong",
      priceAmount: priceAmount ? Number(priceAmount) : null,
      currency: currency.trim() || null,
      travelerIds,
      externalLinks: linkUrl ? [{ id: booking?.externalLinks[0]?.id ?? "link-local-1", label: copy.externalLinkLabel, url: linkUrl, provider: providerName.trim() || null, accessNote: null }] : [],
      relatedItineraryItemIds,
      relatedTaskIds,
      relatedExpenseIds,
      noteIds,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className={dialogBackdropClassName} role="presentation">
      <section className={dialogClassName} role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title">
        <div className={dialogHeaderClassName}>
          <h2 id="booking-dialog-title">{booking ? copy.editBookingDialog : copy.addBookingDialog}</h2>
          <IconButton type="button" aria-label={copy.closeBookingDialog} onClick={onCancel}><Icon name="x" /></IconButton>
        </div>
        <form className={dialogFormClassName} onSubmit={submit}>
          <div className={dialogGridClassName}>
            <label className={fieldClassName}><span>{copy.titleField}</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className={fieldClassName}><span>{copy.typeField}</span><select value={type} onChange={(event) => setType(event.target.value as BookingDocType)}>{bookingTypes.map((item) => <option key={item} value={item}>{formatEnumLabel(item, copy)}</option>)}</select></label>
            <label className={fieldClassName}><span>{copy.statusField}</span><select value={status} onChange={(event) => setStatus(event.target.value as BookingDocStatus)}>{bookingStatuses.map((item) => <option key={item} value={item}>{formatEnumLabel(item, copy)}</option>)}</select></label>
            <label className={fieldClassName}><span>{copy.visibilityField}</span><select value={visibility} onChange={(event) => setVisibility(event.target.value as BookingDocVisibility)}>{bookingVisibilities.map((item) => <option key={item} value={item}>{formatEnumLabel(item, copy)}</option>)}</select></label>
            <label className={fieldClassName}><span>{copy.providerField}</span><input value={providerName} onChange={(event) => setProviderName(event.target.value)} /></label>
            <label className={fieldClassName}><span>{copy.confirmationCodeField}</span><input value={confirmationCode} onChange={(event) => setConfirmationCode(event.target.value)} /></label>
            <label className={fieldClassName}><span>{copy.startField}</span><DateTimePickerField value={startsAt} onChange={setStartsAt} /></label>
            <label className={fieldClassName}><span>{copy.endField}</span><DateTimePickerField value={endsAt} onChange={setEndsAt} /></label>
            <label className={fieldClassName}><span>{copy.priceField}</span><input inputMode="decimal" type="number" min="0" step="0.01" value={priceAmount} onChange={(event) => setPriceAmount(event.target.value)} /></label>
            <label className={fieldClassName}><span>{copy.currencyField}</span><input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></label>
            <label className={fieldClassName}><span>{copy.externalLinkField}</span><input type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} /></label>
            <label className={cn(fieldClassName, "col-span-full")}><span>{copy.notesField}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          </div>
          <div className="grid gap-3">
            <CheckboxGroup
              label={copy.travelersField}
              options={trip.members.map((member) => ({ id: member.id, label: member.displayName }))}
              selectedIds={travelerIds}
              onToggle={(memberId) => setTravelerIds((current) => toggleId(current, memberId))}
            />
            <CheckboxGroup
              label={copy.linkedItinerary}
              options={trip.itineraryItems.map((item) => ({ id: item.id, label: `${item.day} · ${item.activity}` }))}
              selectedIds={relatedItineraryItemIds}
              onToggle={(itemId) => setRelatedItineraryItemIds((current) => toggleId(current, itemId))}
            />
            <CheckboxGroup
              label={copy.linkedTodos}
              options={tasks.map((task) => ({ id: task.id, label: task.title }))}
              selectedIds={relatedTaskIds}
              onToggle={(taskId) => setRelatedTaskIds((current) => toggleId(current, taskId))}
            />
            <CheckboxGroup
              label={copy.linkedExpenses}
              options={trip.expenses.map((expense) => ({ id: expense.id, label: expense.title }))}
              selectedIds={relatedExpenseIds}
              onToggle={(expenseId) => setRelatedExpenseIds((current) => toggleId(current, expenseId))}
            />
            <CheckboxGroup
              label={copy.linkedNotes}
              options={stopNotes.map((note) => ({ id: note.id, label: note.body }))}
              selectedIds={noteIds}
              onToggle={(noteId) => setNoteIds((current) => toggleId(current, noteId))}
            />
          </div>
          <div className={dialogActionsClassName}>
            <Button type="button" variant="secondary" onClick={onCancel}>{copy.cancel}</Button>
            <Button type="submit">{copy.saveBooking}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function CheckboxGroup({
  label,
  options,
  selectedIds,
  onToggle,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  if (!options.length) return null;

  return (
    <fieldset className="grid gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-3">
      <legend className="px-1 text-[11px] font-extrabold text-(--color-text-muted)">{label}</legend>
      <div className="grid max-h-36 gap-1.5 overflow-auto pr-1">
        {options.map((option) => (
          <label className="grid min-h-8 grid-cols-[18px_minmax(0,1fr)] items-center gap-2 text-xs font-bold text-(--color-text)" key={option.id}>
            <input type="checkbox" checked={selectedIds.includes(option.id)} onChange={() => onToggle(option.id)} />
            <span className="min-w-0 truncate">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((candidate) => candidate !== id) : [...ids, id];
}

function formatEnumLabel(value: keyof typeof bookingCopy.en.enumLabels | keyof typeof bookingCopy.th.enumLabels, copy: typeof bookingCopy.en | typeof bookingCopy.th): string {
  return copy.enumLabels[value];
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 16);
}

function fromDateTimeLocalValue(value: string): string | null {
  return value ? value : null;
}

function countBookingFolders(docs: BookingDoc[]): Record<BookingFolderId, number> {
  return bookingFolders.reduce((counts, folder) => {
    counts[folder.id] = docs.filter((doc) => bookingDocMatchesFolder(doc, folder.id)).length;
    return counts;
  }, {} as Record<BookingFolderId, number>);
}

function bookingDocMatchesFolder(doc: BookingDoc, folderId: BookingFolderId): boolean {
  const folder = bookingFolders.find((candidate) => candidate.id === folderId);
  if (!folder || folder.id === "all") return true;
  if (folder.id === "external_links") return doc.externalLinks.length > 0;
  if (folder.status) return doc.status === folder.status;
  return folder.types?.includes(doc.type) ?? true;
}

function compareBookingStartWithUndated(left: BookingDoc, right: BookingDoc): number {
  const leftTime = Number.isFinite(Date.parse(left.startsAt ?? "")) ? Date.parse(left.startsAt ?? "") : Number.POSITIVE_INFINITY;
  const rightTime = Number.isFinite(Date.parse(right.startsAt ?? "")) ? Date.parse(right.startsAt ?? "") : Number.POSITIVE_INFINITY;
  return leftTime - rightTime || left.title.localeCompare(right.title);
}

function bookingDocMatchesQuery(doc: BookingDoc, trip: Trip, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return [
    doc.title,
    doc.providerName,
    doc.confirmationCode,
    doc.notes,
    bookingDocLinkedContext(doc, trip),
    ...doc.externalLinks.flatMap((link) => [link.label, link.url, link.provider, link.accessNote]),
    ...trip.members.filter((member) => doc.travelerIds.includes(member.id)).map((member) => member.displayName),
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalizedQuery));
}

function bookingDocLinkedContext(doc: BookingDoc, trip: Trip): string {
  return doc.relatedItineraryItemIds
    .map((itemId) => trip.itineraryItems.find((item) => item.id === itemId)?.activity)
    .filter(Boolean)
    .join(", ");
}

function bookingTypeIcon(type: BookingDocType): Parameters<typeof Icon>[0]["name"] {
  if (type === "flight" || type === "train" || type === "public_transport") return "route";
  if (type === "hotel") return "home";
  if (type === "activity_ticket") return "ticket";
  if (type === "passport" || type === "visa" || type === "insurance") return "document";
  return "ticket";
}

function typeIconClassName(type: BookingDocType): string {
  if (type === "flight" || type === "train" || type === "public_transport") return "border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)";
  if (type === "hotel") return "border-(--color-success-border) bg-(--color-success-soft) text-(--color-success-strong)";
  if (type === "activity_ticket") return "border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning-strong)";
  if (type === "passport" || type === "visa" || type === "insurance") return "border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)";
  return "border-(--color-border) bg-(--color-surface-subtle) text-(--color-text-muted)";
}

function statusBadgeClassName(status: BookingDocStatus): string {
  if (status === "needs_action") return "border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning-strong)";
  if (status === "paid" || status === "confirmed") return "border-(--color-success-border) bg-(--color-success-soft) text-(--color-success-strong)";
  if (status === "cancelled" || status === "expired") return "border-(--color-danger-border) bg-(--color-danger-soft) text-(--color-danger)";
  return "border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)";
}
