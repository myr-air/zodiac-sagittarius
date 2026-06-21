import type {
  CreateBookingDocApiRequest,
  PatchBookingDocApiRequest,
} from "../api-client";
import type { BookingDoc } from "../types";
import type {
  BookingDocInputLike,
  BuildCreateBookingDocRequestOptions,
  BuildPatchBookingDocRequestOptions,
} from "./booking-doc-inputs";

export function serializeBookingDocInputForApi(
  input: BookingDocInputLike & { tripPlanId?: string | null },
) {
  return {
    ...input,
    title: input.title.trim(),
    startsAt: normalizeBookingDocDateTimeForApi(input.startsAt, input.timezone),
    endsAt: normalizeBookingDocDateTimeForApi(input.endsAt, input.timezone),
    providerName: input.providerName?.trim() || null,
    confirmationCode: input.confirmationCode?.trim() || null,
    timezone: input.timezone?.trim() || null,
    currency: input.currency?.trim() || null,
    notes: input.notes?.trim() || null,
    externalLinks: input.externalLinks.map((link) => ({
      ...(isUuid(link.id) ? { id: link.id } : {}),
      label: link.label.trim(),
      url: link.url.trim(),
      provider: link.provider?.trim() || null,
      accessNote: link.accessNote?.trim() || null,
    })),
  };
}

export function buildCreateBookingDocRequest(
  input: BookingDocInputLike & { tripPlanId?: string | null },
  options: BuildCreateBookingDocRequestOptions,
): CreateBookingDocApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    ...serializeBookingDocInputForApi(input),
  };
}

export function buildPatchBookingDocRequest(
  input: BookingDocInputLike & { tripPlanId?: string | null },
  options: BuildPatchBookingDocRequestOptions,
): PatchBookingDocApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: options.expectedVersion,
    patch: serializeBookingDocInputForApi(input),
  };
}

function normalizeBookingDocDateTimeForApi(
  value: string | null | undefined,
  timezone: BookingDoc["timezone"],
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)) return trimmed;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return trimmed;
  const [, year, month, day, hour, minute, second = "00"] = match;
  const offsetMinutes = offsetMinutesForLocalDateTime({
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    month: Number(month),
    second: Number(second),
    timezone: timezone?.trim() || null,
    year: Number(year),
  });
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${formatUtcOffset(offsetMinutes)}`;
}

function offsetMinutesForLocalDateTime(input: {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  timezone: string | null;
  year: number;
}): number {
  if (!input.timezone) return 0;
  try {
    const utcGuess = Date.UTC(
      input.year,
      input.month - 1,
      input.day,
      input.hour,
      input.minute,
      input.second,
    );
    const firstOffset = offsetMinutesForInstant(input.timezone, new Date(utcGuess));
    const corrected = new Date(utcGuess - firstOffset * 60_000);
    return offsetMinutesForInstant(input.timezone, corrected);
  } catch {
    return 0;
  }
}

function offsetMinutesForInstant(timezone: string, instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric",
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((accumulator, part) => {
      if (part.type !== "literal") accumulator[part.type] = part.value;
      return accumulator;
    }, {});

  const localAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((localAsUtc - instant.getTime()) / 60_000);
}

function formatUtcOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "Z";
  const sign = offsetMinutes > 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (absoluteMinutes % 60).toString().padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}

function isUuid(value: string | undefined): boolean {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
